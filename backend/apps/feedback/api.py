# apps/feedback/api.py
from __future__ import annotations
import json
import os
import requests
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .prompt_feedback import (
    create_generator_prompt,
    create_verifier_prompt,
    extract_text,
    safe_json,
    ensure_json_string,
)
from .selector import prepare_feedback_inputs  # 서버 측에서 rubrics/gaps 계산

# ==== OpenAI Chat Completions ====
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE = os.getenv("OPENAI_BASE", "https://api.openai.com/v1")
DEFAULT_GEN_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
DEFAULT_GEN_TEMP = float(os.getenv("OPENAI_TEMPERATURE", "0.2"))

def call_llm(
    prompt: str,
    model: str = DEFAULT_GEN_MODEL,
    temperature: float = DEFAULT_GEN_TEMP
) -> Dict[str, Any]:
    """
    OpenAI Chat Completions 호출.
    prompt는 user에 통째로 넣고, system엔 'JSON만 출력'을 간단히 명시.
    """
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
    r = requests.post(url, headers=headers, json=body, timeout=45)
    r.raise_for_status()
    return r.json()

router = APIRouter(prefix="/feedback", tags=["feedback"])

# -------- 요청/응답 모델 --------

class GenerateRequest(BaseModel):
    # 공통
    original_text: str = ""

    # (A) 프론트가 직접 넘기는 원시 점수/자질 입력
    feat29: Dict[str, float] | None = None
    rubric_scores: Dict[str, float] | None = None
    top_k_features: List[str] | None = None

    # (B) 이미 계산된 값(우선 사용)
    target_rubrics: List[str] = Field(default_factory=list)
    elite_gaps: List[Dict[str, Any]] = Field(default_factory=list)

    # 기타 메타 (그대로 에코)
    meta: Dict[str, Any] = Field(default_factory=dict)

class GenerateResponse(BaseModel):
    # 프론트 기본 렌더용
    final_md: str
    # 프론트 호환: Feedback.jsx는 final_markdown를 읽음
    final_markdown: Optional[str] = None

    # 레거시/호환 키
    ai_md: Optional[str] = None
    ai_json: Optional[Dict[str, Any]] = None

    # 부가 정보
    meta: Dict[str, Any] = Field(default_factory=dict)

    # 디버그/확인용(옵션)
    draft: Optional[str] = None
    target_rubrics: Optional[List[str]] = None
    elite_gaps_preview: Optional[List[Dict[str, Any]]] = None


# --- 디버그: selector 결과만 확인 (LLM 미호출) ---
@router.post("/debug-select")
def debug_select(payload: dict):
    """
    입력: {
      "feat29": { ...29개 자질 점수... },
      "rubric_scores": { ...8개 루브릭 점수... },
      "client_topk": ["선택", "힌트용", "..."]   # 옵션
    }
    출력: target_rubrics(2개), elite_gaps(6개; guides 포함)
    """
    try:
        feat29 = payload.get("feat29") or {}
        rubric_scores = payload.get("rubric_scores") or {}
        client_topk = payload.get("client_topk")

        if not isinstance(feat29, dict) or not feat29:
            raise HTTPException(status_code=422, detail="feat29 required")
        if not isinstance(rubric_scores, dict) or not rubric_scores:
            raise HTTPException(status_code=422, detail="rubric_scores required")

        # 숫자화(문자/None 방어)
        feat29 = {
            k: float(v) if isinstance(v, (int, float)) else 0.0
            for k, v in feat29.items()
        }

        target_rubrics, elite_gaps = prepare_feedback_inputs(
            feat29=feat29,
            rubric_scores=rubric_scores,
            client_topk=client_topk,
            top_k=6,
        )

        return {
            "ok": True,
            "target_rubrics": target_rubrics,  # 정확히 2개
            "elite_gaps": elite_gaps,          # 정확히 6개 (각 항목에 guide 포함)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"debug-select failed: {e}")


# -------- 메인 엔드포인트 --------

@router.post("/generate", response_model=GenerateResponse)
def generate_feedback(req: GenerateRequest) -> GenerateResponse:
    """
    파이프라인:
    0) 입력 검증 + 필요 시 selector로 target_rubrics/elite_gaps 산출
    1) Generator 프롬프트 → LLM 호출 → 안전 텍스트 추출 → JSON 파싱
    2) Verifier 단계는 **LLM 재호출하지 않고** 서버에서 MD 조립
    3) ai_md/ai_json/final_markdown 키를 항상 채워서 프론트 호환 보장
    """

    original_text = (req.original_text or "").strip()
    if not original_text:
        raise HTTPException(status_code=400, detail="original_text가 비어 있습니다.")

    # 0) 서버에서 rubrics/gaps 보정
    target_rubrics = list(req.target_rubrics or [])
    elite_gaps = list(req.elite_gaps or [])

    # 프론트에서 원시 입력(feat29/rubric_scores)을 보냈고 rubrics/gaps가 비어있다면 서버에서 계산
    if (not target_rubrics or not elite_gaps) and req.feat29 and req.rubric_scores:
        try:
            t_rubrics, e_gaps = prepare_feedback_inputs(
                feat29=req.feat29,
                rubric_scores=req.rubric_scores,
                client_topk=req.top_k_features or [],
                top_k=6,
            )
            if not target_rubrics:
                target_rubrics = t_rubrics
            if not elite_gaps:
                elite_gaps = e_gaps
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"selector 계산 실패: {e}")

    # 1) Generator 프롬프트 생성 및 LLM 호출
    gen_prompt = create_generator_prompt(
        original_text=original_text,
        target_rubrics=target_rubrics,
        elite_gaps=elite_gaps,
    )

    try:
        raw_resp = call_llm(gen_prompt, model=DEFAULT_GEN_MODEL, temperature=DEFAULT_GEN_TEMP)
        gen_text = extract_text(raw_resp)
    except Exception:
        # 방어적 디폴트 (LLM 에러 시에도 UI가 깨지지 않도록)
        fallback = {
            "summary": "생성 실패로 간단 요약만 제공합니다.",
            "issues": [],
            "action_plan": [],
            "sample_edits": [],
            "reasoning_brief": [],
            "one_liner": "요청 처리 중 오류 발생.",
        }
        gen_text = json.dumps(fallback, ensure_ascii=False)

    # 1-2) JSON 파싱(코드펜스/주석 복구 포함)
    gen_json = safe_json(gen_text)
    # 1-3) 유효 JSON 문자열 확보 (저장/검증용)
    draft_json_str = ensure_json_string(gen_json if gen_json else gen_text)

    # 2) Verifier 단계: LLM 재호출 금지 — 서버에서 최종 MD 조립
    final_md = create_verifier_prompt(original_text, draft_json_str)

    # 3) 응답 구성 (프론트 호환 키 ai_md/ai_json/final_markdown 항상 포함)
    try:
        parsed_for_front = json.loads(draft_json_str) if draft_json_str else {}
    except Exception:
        parsed_for_front = {}

    return GenerateResponse(
        final_md=final_md,
        final_markdown=final_md,         # ✅ 프론트 Feedback.jsx 호환
        ai_md=final_md,                  # (레거시) 프론트가 aiMd만 읽어도 보임
        ai_json=parsed_for_front,        # JSON 뷰가 필요하면 여기 사용
        meta=req.meta or {},
        draft=draft_json_str,
        target_rubrics=target_rubrics or None,
        elite_gaps_preview=elite_gaps or None,
    )
