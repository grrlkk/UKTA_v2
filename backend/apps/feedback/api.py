# backend/apps/feedback/api.py
import os, json, re, hashlib
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv

from .prompt_feedback import create_generator_prompt, create_verifier_prompt

# ===== ENV =====
load_dotenv(find_dotenv())
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

router = APIRouter(prefix="/feedback", tags=["feedback"])

DEFAULT_SAVE_DIR = os.getenv(
    "FEEDBACK_SAVE_DIR",
    "/home/ttytu/projects/KorCAT-web copy/backend/apps/feedback/fb_result",
)

DEFAULT_MODEL = os.getenv("FEEDBACK_MODEL", "gpt-4o-mini")
DEFAULT_TEMP = float(os.getenv("FEEDBACK_TEMPERATURE", "0.2"))
ALLOW_CLIENT_OVERRIDE = os.getenv("FEEDBACK_ALLOW_CLIENT_OVERRIDE", "false").lower() == "true"

# ===== Utils =====
def _ensure_dir(path_str: str) -> Path:
    p = Path(path_str)
    p.mkdir(parents=True, exist_ok=True)
    return p

def _safe_name(text: str, limit: int = 16) -> str:
    h = hashlib.sha1(text.encode("utf-8", errors="ignore")).hexdigest()[:10]
    preview = "".join(ch for ch in text.strip().splitlines()[0][:limit] if ch.isalnum())
    return f"{h}_{preview or 'nohdr'}"

def _save_feedback_json(save_dir: str, payload: dict) -> str:
    d = _ensure_dir(save_dir)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    base = _safe_name(payload.get("original_text", ""))
    fname = f"fb_{ts}.json"
    fpath = d / fname
    with fpath.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return str(fpath)

def _chat(model: str, messages: list, temperature: float) -> str:
    if not client or not client.api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY missing")
    r = client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=messages,
    )
    return r.choices[0].message.content

def _resolve_params(req_model: str | None, req_temp: float | None) -> tuple[str, float]:
    """
    서버에서 최종 파라미터 결정.
    allow_client_override=false면 .env 기본값이 항상 우선.
    """
    if ALLOW_CLIENT_OVERRIDE:
        model = (req_model or DEFAULT_MODEL).strip()
        temp = float(req_temp if req_temp is not None else DEFAULT_TEMP)
    else:
        model = DEFAULT_MODEL
        temp = DEFAULT_TEMP
    return model, temp

# ===== Schema =====
class FeedbackReq(BaseModel):
    original_text: str
    model: str | None = None
    temperature: float | None = None

# ===== Route =====
@router.post("/generate")
def generate_feedback(req: FeedbackReq):
    # 0) 파라미터 결정
    model, temp = _resolve_params(req.model, req.temperature)

    # 1) Call #1: Generator → draft JSON
    g_prompt = create_generator_prompt(req.original_text)
    draft_json = _chat(
        model,
        [
            {"role": "system", "content": "You are a helpful writing assistant."},
            {"role": "user", "content": g_prompt},
        ],
        temp,
    )

    # LLM 출력 JSON 정리
    try:
        draft = json.loads(draft_json)
    except Exception:
        m = re.search(r"\{.*\}", draft_json, re.S)
        if not m:
            raise HTTPException(status_code=500, detail="Invalid draft JSON from LLM")
        draft = json.loads(m.group(0))

    # 2) Call #2: Verifier → Final Markdown
    v_prompt = create_verifier_prompt(req.original_text, json.dumps(draft, ensure_ascii=False))
    final_md = _chat(
        model,
        [
            {"role": "system", "content": "You are a precise verifier for writing feedback."},
            {"role": "user", "content": v_prompt},
        ],
        0.1,  # 검증은 낮은 temperature 추천
    )

    # 3) 저장 payload 구성 및 저장
    payload = {
        "original_text": req.original_text,
        "draft": draft,
        "final_markdown": final_md,
        "meta": {
            "model": model,
            "temperature": temp,
            "created_at": datetime.now().isoformat(timespec="seconds"),
            "allow_client_override": ALLOW_CLIENT_OVERRIDE,
            # saved_path는 저장 후에 주입
        },
    }
    saved_path = _save_feedback_json(DEFAULT_SAVE_DIR, payload)
    payload["meta"]["saved_path"] = saved_path

    # 4) 응답 (프론트에서 바로 쓰기 쉽게)
    return {
        "draft": draft,
        "final_markdown": final_md,
        "meta": payload["meta"],
        "saved_path": saved_path,
    }
