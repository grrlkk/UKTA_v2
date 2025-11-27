# /home/ukta/KorCAT-web_v2/backend/apps/routers.py

import datetime
from typing import List

import apps.cohesion.textpreprocess as tp
from apps.cohesion.process import process
import torch
from apps.morph.morph import mecab
from apps.morph.bareun import bareun
from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile
import os, json, re
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# >>> 채점 기능을 위해 필요한 임포트
from apps.cohesion.essay_scoring.essay_scoring import (
    load_essay_model,
    score_results_with_feats,
)
# ❌ 자동 피드백 호출을 제거했으므로 아래 임포트는 더 이상 필요 없습니다.
# from apps.feedback.api import generate_feedback, FeedbackReq

# pydantic.json.ENCODERS_BY_TYPE[ObjectId] = str
router = APIRouter()

# -------- 채점 전용 요청/응답 모델 --------
class ScoreRequest(BaseModel):
    """외부에서 작문 텍스트를 전달받아 채점만 수행하는 요청 모델"""
    text: str

class ScoreResponse(BaseModel):
    """채점 결과 반환 응답 모델"""
    total_score: float = 0.0
    rubric_scores: dict = {}
    process_time: float = 0.0
    text_length: int = 0
    doc_id: str = ""  # MongoDB 문서 ID

# .env 로드 (프로젝트 루트: /home/ttytu/projects/KorCAT-web copy/.env)
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

# 키 이름은 OPENAI_API_KEY 또는 OPEN_AI_KEY 둘 다 지원
OPENAI_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPEN_AI_KEY")
client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None

morph = bareun()

# >>> KoBERT/GRU 모델은 서버 기동 시 1회 로드(속도 ↑)
_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_BERT, _GRU, _TOK = load_essay_model(_DEVICE)

# POST: 채점 수행 + MongoDB 저장 엔드포인트 =================
@router.post("/cohesion/score", tags=["cohesion"], response_model=ScoreResponse)
async def score_text_only(req: ScoreRequest, request: Request):
    """
    외부에서 작문 텍스트를 전달받아 채점 결과를 반환하고 MongoDB에 저장합니다.

    요청 예시:
    {
        "text": "채점할 작문 내용..."
    }

    응답 예시:
    {
        "total_score": 75.0,
        "rubric_scores": {
            "topic_clarity": 12,
            "narrative": 10,
            ...
        },
        "process_time": 2.5,
        "text_length": 500,
        "doc_id": "2025-11-27-11:30:00-S100"
    }
    """
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text가 비어 있습니다.")

    now = datetime.datetime.now()

    try:
        # 1) 형태소/자질 추출
        results = process(text)

        # 2) 채점 수행
        rs = score_results_with_feats(results, _BERT, _GRU, _TOK)

        process_time = (datetime.datetime.now() - now).total_seconds()

        # 3) 응답 구성 - 개별 rubric 점수 추출 및 총점 계산
        all_rubric_keys = [
            "topic_clarity", "narrative", "originality",
            "intra_paragraph_structure", "inter_paragraph_structure",
            "grammar", "vocabulary", "sentence_expression",
            "structural_consistency", "length", "prompt_comprehension"
        ]

        score_max = {
            "topic_clarity": 15, "narrative": 15, "originality": 15,
            "intra_paragraph_structure": 15, "inter_paragraph_structure": 15,
            "grammar": 6, "vocabulary": 6, "sentence_expression": 6,
            "structural_consistency": 3, "length": 3, "prompt_comprehension": 3
        }

        rubric_scores = {}
        for k in all_rubric_keys:
            raw = rs.get(k, 0)
            max_score = score_max.get(k, 3)
            rubric_scores[k] = round(raw * max_score / 3)

        main_rubrics = [
            "topic_clarity", "narrative", "originality",
            "intra_paragraph_structure", "inter_paragraph_structure",
            "grammar", "vocabulary", "sentence_expression"
        ]
        total_score = sum(rubric_scores.get(k, 0) for k in main_rubrics)

        # 4) MongoDB에 저장
        rs.pop("text", None)  # 원문은 contents에 저장하므로 중복 제거
        results = results or {}
        results["essay_score"] = rs

        doc_id = now.strftime("%Y-%m-%d-%H:%M:%S") + "-S100"
        upload = {
            "_id": doc_id,
            "upload_date": now,
            "process_time": process_time,
            "filename": "api_score_request",
            "contents": text,
            "results": results,
            "total_score": total_score,
            "rubric_scores": rubric_scores,
        }

        await request.app.mongodb["cohesion"].insert_one(upload)
        logger.info(f"[score_text_only] saved to MongoDB: {doc_id}, total_score={total_score}")

        return ScoreResponse(
            total_score=total_score,
            rubric_scores=rubric_scores,
            process_time=process_time,
            text_length=len(text),
            doc_id=doc_id
        )

    except Exception as e:
        logger.exception(f"[score_text_only ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"채점 처리 중 오류 발생: {str(e)}")

# POST: upload multiple .txt files =============================
@router.post("/cohesion", tags=["cohesion"])
async def upload_files(request: Request, files: List[UploadFile] = File(...)):
    cnt = 100

    for file in files:
        contents = await file.read()

        print(file.filename)
        print(contents.decode("UTF8"))

        now = datetime.datetime.now()

        # 1) 형태소/자질 추출
        results = process(contents.decode("UTF8"))  # ← extracted_features 구조

        # 2) (선택) CUDA 캐시 정리
        # try:
        #     torch.cuda.empty_cache()
        # except Exception:
        #     pass

        # 3) 채점 + 원문/feat29까지 얻기
        try:
            rs = score_results_with_feats(results, _BERT, _GRU, _TOK)
            f29 = rs.get("feat29")
            logger.info("[essay_score OK] keys=%s", list(rs.keys()))
            logger.info("[feat29 exist=%s size=%s sample_keys=%s]",
                        isinstance(f29, dict), len(f29 or {}), list((f29 or {}).keys())[:5])
        except Exception as e:
            # 문제 생겨도 저장은 하되, 에러 표시
            rs = {"error": str(e)}
            logger.exception("[essay_score ERROR] %s", e)

        
        process_time = datetime.datetime.now() - now

        rs.pop("text", None)
        
        # results 내부로 병합
        results = results or {}
        results["essay_score"] = rs
        logger.info("[merge] results.has essay_score=%s", "essay_score" in results)
        
        
        upload = {
            "_id": now.strftime("%Y-%m-%d-%H:%M:%S") + "-C" + str(cnt),
            "upload_date": now,
            "process_time": process_time.total_seconds(),
            "filename": file.filename,
            "contents": contents.decode("UTF8"),
            "results": results,  # ← 이제 results.essay_score 로 접근 가능
        }
        cnt += 1

        new_file = await request.app.mongodb["cohesion"].insert_one(upload)
        created_file = await request.app.mongodb["cohesion"].find_one(
            {"_id": new_file.inserted_id}
        )

    return {"filenames": [file.filename for file in files]}

@router.post("/morpheme", tags=["morpheme"])
async def upload_files(request: Request, files: List[UploadFile] = File(...)):
    cnt = 100

    # make object for each file uploaded
    for file in files:
        contents = await file.read()

        print(file.filename)
        print(contents.decode("UTF8"))

        now = datetime.datetime.now()

        # process the uploaded text
        sentences = tp.splitText(contents.decode("UTF8"))
        results = morph.tags(sentences).as_json()

        process_time = datetime.datetime.now() - now

        # each object being uploaded to MONGODB
        upload = {
            "_id": now.strftime("%Y-%m-%d-%H:%M:%S") + "-M" + str(cnt),
            "upload_date": now,
            "process_time": process_time.total_seconds(),
            "filename": file.filename,
            "contents": contents.decode("UTF8"),
            "sentences": list(sentences),
            "results": results,
        }
        cnt += 1

        new_file = await request.app.mongodb["morpheme"].insert_one(upload)
        created_file = await request.app.mongodb["morpheme"].find_one(
            {"_id": new_file.inserted_id}
        )

    return {"filenames": [file.filename for file in files]}

# GET: list all files; list file by ID =========================
@router.get("/cohesion", response_description="List all files", tags=["cohesion"])
async def list_files(request: Request):
    files = []
    for doc in await request.app.mongodb["cohesion"].find().sort("upload_date", -1).to_list(length=100):
        files.append(doc)
    return files

@router.get(
    "/cohesion/simple", response_description="List all files", tags=["cohesion"]
)
async def list_files_simple(request: Request):
    files = []
    for doc in (
        await request.app.mongodb["cohesion"]
        .find(
            {},
            {
                "_id": 1,
                "upload_date": 1,
                "process_time": 1,
                "filename": 1,
                "contents": 1,
            },
        )
        .sort("upload_date", -1)
        .to_list(length=100)
    ):
        files.append(doc)
    return files

@router.get("/morpheme", response_description="List all files", tags=["morpheme"])
async def list_files(request: Request):
    files = []
    for doc in await request.app.mongodb["morpheme"].find().to_list(length=100):
        files.append(doc)
    return files

@router.get(
    "/cohesion/{id}", response_description="Get a single file", tags=["cohesion"]
)
async def show_file(id: str, request: Request):
    if (
        file := await request.app.mongodb["cohesion"].find_one({"_id": id})
    ) is not None:
        return file
    raise HTTPException(status_code=404, detail=f"File {id} not found")

@router.get(
    "/morpheme/{id}", response_description="Get a single file", tags=["morpheme"]
)
async def show_file(id: str, request: Request):
    if (
        file := await request.app.mongodb["morpheme"].find_one({"_id": id})
    ) is not None:
        return file
    raise HTTPException(status_code=404, detail=f"File {id} not found")

# delete file by ID ============================================
@router.delete("/cohesion/{id}", response_description="Delete file", tags=["cohesion"])
async def delete_file_cohesion(id: str, request: Request):
    delete_result = await request.app.mongodb["cohesion"].delete_one({"_id": id})
    if delete_result.deleted_count == 1:
        return Response(status_code=204)
    raise HTTPException(status_code=404, detail=f"Task {id} not found")

# delete file by ID ============================================
@router.delete("/morpheme/{id}", response_description="Delete file", tags=["morpheme"])
async def delete_file_morpheme(id: str, request: Request):
    delete_result = await request.app.mongodb["morpheme"].delete_one({"_id": id})
    if delete_result.deleted_count == 1:
        return Response(status_code=204)
    raise HTTPException(status_code=404, detail=f"Task {id} not found")