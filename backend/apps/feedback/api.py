# apps/feedback/api.py
from __future__ import annotations

import json
import math
import os
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .prompt_feedback import (
    create_generator_prompt,
    create_verifier_prompt,
    ensure_json_string,
    extract_text,
    safe_json,
)
from .selector import prepare_feedback_inputs

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE = os.getenv("OPENAI_BASE", "https://api.openai.com/v1")
DEFAULT_GEN_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
DEFAULT_GEN_TEMP = float(os.getenv("OPENAI_TEMPERATURE", "0.2"))


router = APIRouter(prefix="/feedback", tags=["feedback"])


class GenerateRequest(BaseModel):
    original_text: str = ""

    feat29: Any = None
    rubric_scores: Any = None
    top_k_features: Any = None

    target_rubrics: List[str] = Field(default_factory=list)
    elite_gaps: List[Dict[str, Any]] = Field(default_factory=list)

    meta: Dict[str, Any] = Field(default_factory=dict)


class GenerateResponse(BaseModel):
    final_md: str
    final_markdown: Optional[str] = None

    ai_md: Optional[str] = None
    ai_json: Optional[Dict[str, Any]] = None

    meta: Dict[str, Any] = Field(default_factory=dict)

    draft: Optional[str] = None
    target_rubrics: Optional[List[str]] = None
    elite_gaps_preview: Optional[List[Dict[str, Any]]] = None


def call_llm(
    prompt: str,
    model: str = DEFAULT_GEN_MODEL,
    temperature: float = DEFAULT_GEN_TEMP,
) -> Dict[str, Any]:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY가 환경변수로 설정되지 않았습니다.")

    url = f"{OPENAI_BASE}/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model,
        "temperature": temperature,
        "messages": [
            {
                "role": "system",
                "content": (
                    "너는 국어학 기반 한국어 글쓰기 컨설턴트다. "
                    "오직 JSON만 출력하고, 코드펜스/서문/마크다운 금지."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    }

    response = requests.post(url, headers=headers, json=body, timeout=45)
    response.raise_for_status()
    return response.json()


def _to_float_or_zero(value: Any) -> float:
    if isinstance(value, bool):
        return float(int(value))

    if isinstance(value, (int, float)):
        if isinstance(value, float) and not math.isfinite(value):
            return 0.0
        return float(value)

    if isinstance(value, str):
        s = value.strip()
        if not s:
            return 0.0
        if s.lower() in {"error", "nan", "none", "null", "n/a", "na", "undefined"}:
            return 0.0
        try:
            num = float(s)
            return num if math.isfinite(num) else 0.0
        except Exception:
            return 0.0

    return 0.0


def _sanitize_number_dict(data: Any) -> Dict[str, float]:
    if not isinstance(data, dict):
        return {}
    return {str(k): _to_float_or_zero(v) for k, v in data.items()}


def _sanitize_string_list(values: Any) -> List[str]:
    if not isinstance(values, list):
        return []

    out: List[str] = []
    for value in values:
        if isinstance(value, dict):
            continue
        s = str(value).strip()
        if s:
            out.append(s)
    return out


def _sanitize_target_rubrics(values: Any) -> List[str]:
    if not isinstance(values, list):
        return []
    return [str(v).strip() for v in values if str(v).strip()]


def _sanitize_elite_gaps(values: Any) -> List[Dict[str, Any]]:
    if not isinstance(values, list):
        return []

    out: List[Dict[str, Any]] = []
    for item in values:
        if not isinstance(item, dict):
            continue

        cleaned = dict(item)
        cleaned["feature"] = str(item.get("feature", "")).strip()
        if not cleaned["feature"]:
            continue

        cleaned["label_ko"] = str(item.get("label_ko", "")).strip()
        cleaned["desc_ko_llm"] = str(item.get("desc_ko_llm", "")).strip()
        cleaned["direction"] = str(item.get("direction", "")).strip()
        cleaned["status"] = str(item.get("status", "")).strip()
        cleaned["suggest"] = str(item.get("suggest", "")).strip()
        cleaned["strength"] = str(item.get("strength", "")).strip()
        cleaned["rubric_hint"] = str(item.get("rubric_hint", "")).strip()

        for key in ("value", "elite_center", "z_like", "score", "metric_target"):
            cleaned[key] = _to_float_or_zero(item.get(key))

        guide = item.get("guide")
        cleaned["guide"] = guide if isinstance(guide, dict) else {}
        out.append(cleaned)

    return out


def _fallback_draft_json() -> str:
    fallback = {
        "summary": "자동 진단 정보를 모두 활용하지 못했지만, 글의 흐름과 표현을 중심으로 바로 고쳐 볼 수 있는 방향을 간단히 정리했어요.",
        "issues": [],
        "one_liner": "핵심 문장을 먼저 또렷하게 세우면 글이 한층 안정적으로 읽혀요.",
    }
    return json.dumps(fallback, ensure_ascii=False)


@router.post("/debug-select")
def debug_select(payload: dict):
    try:
        feat29 = _sanitize_number_dict(payload.get("feat29"))
        rubric_scores = _sanitize_number_dict(payload.get("rubric_scores"))
        client_topk = _sanitize_string_list(
            payload.get("client_topk", payload.get("top_k_features"))
        )

        if not feat29:
            raise HTTPException(status_code=422, detail="feat29 required")
        if not rubric_scores:
            raise HTTPException(status_code=422, detail="rubric_scores required")

        target_rubrics, elite_gaps = prepare_feedback_inputs(
            feat29=feat29,
            rubric_scores=rubric_scores,
            client_topk=client_topk,
            top_k=6,
        )

        return {
            "ok": True,
            "target_rubrics": target_rubrics,
            "elite_gaps": elite_gaps,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"debug-select failed: {e}")


@router.post("/generate", response_model=GenerateResponse)
def generate_feedback(req: GenerateRequest) -> GenerateResponse:
    original_text = (req.original_text or "").strip()
    if not original_text:
        raise HTTPException(status_code=400, detail="original_text가 비어 있습니다.")

    sanitized_feat29 = _sanitize_number_dict(req.feat29)
    sanitized_rubric_scores = _sanitize_number_dict(req.rubric_scores)
    sanitized_top_k = _sanitize_string_list(req.top_k_features)

    target_rubrics = _sanitize_target_rubrics(req.target_rubrics)
    elite_gaps = _sanitize_elite_gaps(req.elite_gaps)

    if (not target_rubrics or not elite_gaps) and sanitized_feat29 and sanitized_rubric_scores:
        try:
            selected_rubrics, selected_gaps = prepare_feedback_inputs(
                feat29=sanitized_feat29,
                rubric_scores=sanitized_rubric_scores,
                client_topk=sanitized_top_k,
                top_k=6,
            )
            if not target_rubrics:
                target_rubrics = selected_rubrics
            if not elite_gaps:
                elite_gaps = selected_gaps
        except Exception:
            # selector가 실패해도 전체 피드백 생성은 계속 진행
            pass

    gen_prompt = create_generator_prompt(
        original_text=original_text,
        target_rubrics=target_rubrics,
        elite_gaps=elite_gaps,
    )

    try:
        raw_resp = call_llm(
            gen_prompt,
            model=DEFAULT_GEN_MODEL,
            temperature=DEFAULT_GEN_TEMP,
        )
        gen_text = extract_text(raw_resp)
    except Exception:
        gen_text = _fallback_draft_json()

    gen_json = safe_json(gen_text)
    draft_json_str = ensure_json_string(gen_json if gen_json else gen_text)
    if draft_json_str == "{}":
        draft_json_str = _fallback_draft_json()

    final_md = create_verifier_prompt(original_text, draft_json_str)

    try:
        parsed_for_front = json.loads(draft_json_str) if draft_json_str else {}
    except Exception:
        parsed_for_front = {}

    return GenerateResponse(
        final_md=final_md,
        final_markdown=final_md,
        ai_md=final_md,
        ai_json=parsed_for_front,
        meta=req.meta or {},
        draft=draft_json_str,
        target_rubrics=target_rubrics or None,
        elite_gaps_preview=elite_gaps or None,
    )
