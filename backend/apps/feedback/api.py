# backend/apps/feedback/api.py
from __future__ import annotations

import json
import os
import re
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .prompt_feedback import create_generator_prompt, create_verifier_prompt, _safe_json
from .selector import prepare_feedback_inputs

# ---------------- OpenAI ----------------
try:
    from openai import OpenAI
except Exception:
    OpenAI = None  # 라이브러리 미설치/오프라인 대비

# ---------------- Router ----------------
router = APIRouter(prefix="/feedback", tags=["feedback"])

# ---------------- Config ----------------
RUBRIC_KEYS = [
    "topic_clarity", "narrative", "originality",
    "intra_paragraph_structure", "inter_paragraph_structure",
    "grammar", "vocabulary", "sentence_expression",
]

DEFAULT_GEN_MODEL = os.getenv("OPENAI_MODEL_GEN", os.getenv("OPENAI_MODEL", "gpt-4o-mini"))
DEFAULT_VER_MODEL = os.getenv("OPENAI_MODEL_VER", os.getenv("OPENAI_MODEL", "gpt-4o-mini"))
DEFAULT_GEN_TEMP = float(os.getenv("OPENAI_TEMP_GEN", "0.2"))
DEFAULT_VER_TEMP = float(os.getenv("OPENAI_TEMP_VER", "0.2"))

SAVE_DIR = os.path.join(
    os.getenv("KORCAT_ROOT", "/home/ukta/KorCAT-web_v2"),
    "backend", "apps", "feedback", "fb_result"
)
os.makedirs(SAVE_DIR, exist_ok=True)

ENABLE_DEBUG_RETURN = os.getenv("FEEDBACK_DEBUG_RETURN", "0") == "1"  # 응답에 디버그 포함 여부

# -------------- Schemas -----------------
class GenerateRequest(BaseModel):
    original_text: str
    feat29: Dict[str, float] = Field(default_factory=dict)
    rubric_scores: Dict[str, float] = Field(default_factory=dict)
    top_k_features: List[str] = Field(default_factory=list)

class GenerateResponse(BaseModel):
    final_md: str
    meta: Dict[str, Any] = Field(default_factory=dict)
    saved_path: Optional[str] = None
    # 디버그는 옵션
    draft: Optional[str] = None
    target_rubrics: Optional[List[str]] = None
    elite_gaps_preview: Optional[List[Dict[str, Any]]] = None

# -------------- Helpers -----------------
def _get_openai_client() -> Optional[OpenAI]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or OpenAI is None:
        return None
    return OpenAI(api_key=api_key)

def call_llm(prompt: str, model: str, temperature: float) -> str:
    """
    OpenAI Responses API로 단일 턴 호출. 오프라인/키없음 시 안전 폴백 문자열 반환.
    """
    client = _get_openai_client()
    if client is None:
        return "OFFLINE_MODE: LLM disabled. Set OPENAI_API_KEY to enable."
    resp = client.responses.create(
        model=model,
        temperature=temperature,
        input=[{"role": "user", "content": prompt}],
    )
    return getattr(resp, "output_text", "").strip()

GRADE_RE = re.compile(r"^grade_", re.I)

def _sanitize_metric_links(draft_json_str: str, elite_gaps: List[Dict[str, Any]], feat29: Dict[str, Any]) -> str:
    """
    허용 집합: elite_gaps.features ∪ feat29.keys  (grade_* 제외)
    허용 밖 지표는 |z| 최상위 feature로 대체.
    """
    # draft 복구 (코드블록/마크다운 보호)
    try:
        draft = json.loads(draft_json_str)
    except Exception:
        try:
            draft = _safe_json(draft_json_str)
        except Exception:
            return draft_json_str

    allow = {g.get("feature") for g in elite_gaps if isinstance(g.get("feature"), str)}
    allow |= {k for k in feat29.keys() if isinstance(k, str)}
    allow = {a for a in allow if a and not GRADE_RE.match(a)}

    sorted_feats = sorted(elite_gaps, key=lambda r: abs(r.get("z_like", 0.0)), reverse=True)
    best_feat = (sorted_feats[0]["feature"] if sorted_feats else None)

    for it in draft.get("issues", []):
        raw = (it.get("metric_link") or "").strip()
        items = [x.strip() for x in raw.split(",")] if raw else []
        items = [m for m in items if m in allow]
        if not items and best_feat:
            items = [best_feat]
        it["metric_link"] = ", ".join(items) if items else ""

    return json.dumps(draft, ensure_ascii=False)

def _save_result(payload: Dict[str, Any]) -> str:
    fname = f"fb_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    fpath = os.path.join(SAVE_DIR, fname)
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return fpath

# -------------- Health ------------------
@router.get("/health")
def health():
    return {
        "ok": True,
        "gen_model": DEFAULT_GEN_MODEL,
        "ver_model": DEFAULT_VER_MODEL,
        "save_dir": SAVE_DIR,
        "openai_ready": _get_openai_client() is not None,
    }

# -------------- Main Route --------------
@router.post("/generate", response_model=GenerateResponse)
def generate_feedback(req: GenerateRequest):
    try:
        # --- 0) 선정 단계 ---
        target_rubrics, elite_gaps = prepare_feedback_inputs(
            feat29=req.feat29 or {},
            rubric_scores=req.rubric_scores or {},
            client_topk=req.top_k_features or [],
            top_k=6,
        )

        # 미리보기(응답/저장용 간단 스니펫)
        elite_gaps_preview = [
            {
                "feature": r.get("feature"),
                "label_ko": r.get("label_ko"),
                "z_like": r.get("z_like"),
                "status": r.get("status"),
                "suggest": r.get("suggest"),
                "strength": r.get("strength"),
            }
            for r in elite_gaps
        ]

        # --- 1) Generator ---
        gen_prompt = create_generator_prompt(
            original_text=req.original_text,
            feat29=req.feat29 or {},
            rubric_scores=req.rubric_scores or {},
            top_k_features=req.top_k_features or [],
            target_rubrics=target_rubrics,
            elite_gaps_table=elite_gaps,  # label_ko/desc_ko_llm 포함
        )
        draft_json = call_llm(gen_prompt, model=DEFAULT_GEN_MODEL, temperature=DEFAULT_GEN_TEMP)

        # --- 2) metric_link 안전장치 ---
        draft_json = _sanitize_metric_links(draft_json, elite_gaps, req.feat29 or {})

        # --- 3) Verifier ---
        ver_prompt = create_verifier_prompt(req.original_text, draft_json)
        final_md = call_llm(ver_prompt, model=DEFAULT_VER_MODEL, temperature=DEFAULT_VER_TEMP)

        # --- 4) 저장 페이로드 구성 ---
        payload_for_save = {
            "final_md": final_md,
            "draft": draft_json if ENABLE_DEBUG_RETURN else None,
            "target_rubrics": target_rubrics,
            "elite_gaps_preview": elite_gaps_preview,
            "meta": {
                "gen_model": DEFAULT_GEN_MODEL,
                "ver_model": DEFAULT_VER_MODEL,
                "gen_temp": DEFAULT_GEN_TEMP,
                "ver_temp": DEFAULT_VER_TEMP,
                "created_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "allow_client_override": False,
            },
            "input": {
                "rubric_scores": req.rubric_scores,
                "top_k_features": req.top_k_features,
                "feat_keys": list(req.feat29.keys())[:5] + (["..."] if len(req.feat29) > 5 else []),
            },
        }

        saved_path = _save_result(payload_for_save)

        # --- 5) 응답 ---
        return GenerateResponse(
            final_md=final_md,
            meta=payload_for_save["meta"],
            saved_path=saved_path,
            draft=draft_json if ENABLE_DEBUG_RETURN else None,
            target_rubrics=target_rubrics if ENABLE_DEBUG_RETURN else None,
            elite_gaps_preview=elite_gaps_preview if ENABLE_DEBUG_RETURN else None,
        )

    except Exception as e:
        tb = traceback.format_exc(limit=2)
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "trace": tb,
            },
        )
