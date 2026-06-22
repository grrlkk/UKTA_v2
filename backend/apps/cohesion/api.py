# backend/apps/cohesion/api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch

from apps.cohesion.essay_scoring.essay_scoring import (
    load_essay_model, score_results_with_feats
)

router = APIRouter(prefix="/cohesion", tags=["cohesion"])

# 모델은 모듈 로드시 1번만 로드
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_bert, _gru, _tok = load_essay_model(_device)

class ScoreReq(BaseModel):
    extracted_features: dict

@router.post("/score")
def score_essay(req: ScoreReq):
    """
    extracted_features를 받아 채점만 수행하고,
    채점 결과와 함께 피드백 생성에 필요한 원문/자질 데이터를 반환합니다.
    """
    try:
        rs = score_results_with_feats(req.extracted_features, _bert, _gru, _tok)
        score_keys = [
            "topic_clarity", "narrative", "originality", "intra_paragraph_structure",
            "inter_paragraph_structure", "grammar", "vocab_sentence",
            "vocabulary", "sentence_expression", "structural_consistency",
            "length", "prompt_comprehension",
        ]
        return {
            "scoring": {k: rs[k] for k in score_keys if k in rs},
            "original_text": rs["text"],
            "feat29": rs["feat29"],
            "top_k_features": rs.get("top_k_features", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
