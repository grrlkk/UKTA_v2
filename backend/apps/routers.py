# /home/ukta/KorCAT-web_v2/backend/apps/routers.py

import datetime
from typing import List

import apps.cohesion.textpreprocess as tp
from apps.cohesion.process import process
import torch
from apps.morph.morph import mecab
from apps.morph.bareun import bareun
from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile, Form
import os, json, re
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from apps.cohesion.topic_relevance import get_topic_relevance_score # 신규 주제 적합성 모듈 임포트
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# >>> 채점 기능을 위해 필요한 임포트
from apps.cohesion.essay_scoring.essay_scoring import (
    load_essay_model,
    score_results_with_feats,
)

# pydantic.json.ENCODERS_BY_TYPE[ObjectId] = str
router = APIRouter()

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

# POST: upload multiple .txt files =============================
@router.post("/cohesion", tags=["cohesion"])
async def upload_files(
    request: Request, 
    files: List[UploadFile] = File(...), 
    topic: str = Form(None) # 프론트엔드에서 보낸 주제(topic) 수신 추가
):
    cnt = 100

    for file in files:
        contents = await file.read()
        essay_text = contents.decode("UTF8")

        print(file.filename)
        print(essay_text)

        now = datetime.datetime.now()

        # 1) 주제 적합성 점수 추출 (GPT API 호출)
        topic_score = get_topic_relevance_score(essay_text, topic)

        # 2) 형태소/자질 추출
        results = process(essay_text)  # ← extracted_features 구조

        # 3) 채점 + 원문/feat29까지 얻기
        try:
            rs = score_results_with_feats(results, _BERT, _GRU, _TOK)
            
            # GPT 점수를 채점 결과 객체에 주입 (프론트엔드 루브릭 9번째 행 표시용)
            if isinstance(rs, dict):
                rs["Topic_relevance"] = topic_score if topic_score is not None else "Error"
            
            f29 = rs.get("feat29")
            logger.info("[essay_score OK] keys=%s", list(rs.keys()))
            logger.info("[feat29 exist=%s size=%s sample_keys=%s]",
                        isinstance(f29, dict), len(f29 or {}), list((f29 or {}).keys())[:5])
        except Exception as e:
            # 문제 생겨도 저장은 하되, 에러와 함께 점수 표시
            rs = {"error": str(e), "Topic_relevance": topic_score}
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
            "contents": essay_text,
            "topic": topic, # 입력받은 주제도 DB에 함께 저장
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
    for doc in await request.app.mongodb["cohesion"].find().to_list(length=100):
        files.append(doc)
    return files

@router.get(
    "/cohesion/simple", response_description="List all files", tags=["cohesion"]
)
async def list_files(request: Request):
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
        .to_list()
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



# # /home/ukta/KorCAT-web_v2/backend/apps/routers.py

# import datetime
# from typing import List

# import apps.cohesion.textpreprocess as tp
# from apps.cohesion.process import process
# import torch
# from apps.morph.morph import mecab
# from apps.morph.bareun import bareun
# from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile, Form
# import os, json, re
# from pathlib import Path
# from pydantic import BaseModel
# from dotenv import load_dotenv
# from openai import OpenAI
# from apps.cohesion.topic_relevance import get_topic_relevance_score # 신규 주제 적합성 모듈 임포트
# import logging
# logger = logging.getLogger(__name__)
# logger.setLevel(logging.INFO)

# # >>> 채점 기능을 위해 필요한 임포트
# from apps.cohesion.essay_scoring.essay_scoring import (
#     load_essay_model,
#     score_results_with_feats,
# )

# # pydantic.json.ENCODERS_BY_TYPE[ObjectId] = str
# router = APIRouter()

# # .env 로드 (프로젝트 루트: /home/ttytu/projects/KorCAT-web copy/.env)
# ROOT_DIR = Path(__file__).resolve().parents[2]
# load_dotenv(ROOT_DIR / ".env")

# # 키 이름은 OPENAI_API_KEY 또는 OPEN_AI_KEY 둘 다 지원
# OPENAI_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPEN_AI_KEY")
# client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None

# morph = bareun()

# # >>> KoBERT/GRU 모델은 서버 기동 시 1회 로드(속도 ↑)
# _DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# _BERT, _GRU, _TOK = load_essay_model(_DEVICE)

# # POST: upload multiple .txt files =============================
# @router.post("/cohesion", tags=["cohesion"])
# async def upload_files(request: Request, files: List[UploadFile] = File(...)):
#     cnt = 100

#     for file in files:
#         contents = await file.read()

#         print(file.filename)
#         print(contents.decode("UTF8"))

#         now = datetime.datetime.now()

#         # 1) 형태소/자질 추출
#         results = process(contents.decode("UTF8"))  # ← extracted_features 구조

#         # 2) (선택) CUDA 캐시 정리
#         # try:
#         #     torch.cuda.empty_cache()
#         # except Exception:
#         #     pass

#         # 3) 채점 + 원문/feat29까지 얻기
#         try:
#             rs = score_results_with_feats(results, _BERT, _GRU, _TOK)
#             f29 = rs.get("feat29")
#             logger.info("[essay_score OK] keys=%s", list(rs.keys()))
#             logger.info("[feat29 exist=%s size=%s sample_keys=%s]",
#                         isinstance(f29, dict), len(f29 or {}), list((f29 or {}).keys())[:5])
#         except Exception as e:
#             # 문제 생겨도 저장은 하되, 에러 표시
#             rs = {"error": str(e)}
#             logger.exception("[essay_score ERROR] %s", e)

        
#         process_time = datetime.datetime.now() - now

#         rs.pop("text", None)
        
#         # results 내부로 병합
#         results = results or {}
#         results["essay_score"] = rs
#         logger.info("[merge] results.has essay_score=%s", "essay_score" in results)
        
        
#         upload = {
#             "_id": now.strftime("%Y-%m-%d-%H:%M:%S") + "-C" + str(cnt),
#             "upload_date": now,
#             "process_time": process_time.total_seconds(),
#             "filename": file.filename,
#             "contents": contents.decode("UTF8"),
#             "results": results,  # ← 이제 results.essay_score 로 접근 가능
#         }
#         cnt += 1

#         new_file = await request.app.mongodb["cohesion"].insert_one(upload)
#         created_file = await request.app.mongodb["cohesion"].find_one(
#             {"_id": new_file.inserted_id}
#         )

#     return {"filenames": [file.filename for file in files]}

# @router.post("/morpheme", tags=["morpheme"])
# async def upload_files(request: Request, files: List[UploadFile] = File(...)):
#     cnt = 100

#     # make object for each file uploaded
#     for file in files:
#         contents = await file.read()

#         print(file.filename)
#         print(contents.decode("UTF8"))

#         now = datetime.datetime.now()

#         # process the uploaded text
#         sentences = tp.splitText(contents.decode("UTF8"))
#         results = morph.tags(sentences).as_json()

#         process_time = datetime.datetime.now() - now

#         # each object being uploaded to MONGODB
#         upload = {
#             "_id": now.strftime("%Y-%m-%d-%H:%M:%S") + "-M" + str(cnt),
#             "upload_date": now,
#             "process_time": process_time.total_seconds(),
#             "filename": file.filename,
#             "contents": contents.decode("UTF8"),
#             "sentences": list(sentences),
#             "results": results,
#         }
#         cnt += 1

#         new_file = await request.app.mongodb["morpheme"].insert_one(upload)
#         created_file = await request.app.mongodb["morpheme"].find_one(
#             {"_id": new_file.inserted_id}
#         )

#     return {"filenames": [file.filename for file in files]}

# # GET: list all files; list file by ID =========================
# @router.get("/cohesion", response_description="List all files", tags=["cohesion"])
# async def list_files(request: Request):
#     files = []
#     for doc in await request.app.mongodb["cohesion"].find().to_list(length=100):
#         files.append(doc)
#     return files

# @router.get(
#     "/cohesion/simple", response_description="List all files", tags=["cohesion"]
# )
# async def list_files(request: Request):
#     files = []
#     for doc in (
#         await request.app.mongodb["cohesion"]
#         .find(
#             {},
#             {
#                 "_id": 1,
#                 "upload_date": 1,
#                 "process_time": 1,
#                 "filename": 1,
#                 "contents": 1,
#             },
#         )
#         .to_list()
#     ):
#         files.append(doc)
#     return files

# @router.get("/morpheme", response_description="List all files", tags=["morpheme"])
# async def list_files(request: Request):
#     files = []
#     for doc in await request.app.mongodb["morpheme"].find().to_list(length=100):
#         files.append(doc)
#     return files

# @router.get(
#     "/cohesion/{id}", response_description="Get a single file", tags=["cohesion"]
# )
# async def show_file(id: str, request: Request):
#     if (
#         file := await request.app.mongodb["cohesion"].find_one({"_id": id})
#     ) is not None:
#         return file
#     raise HTTPException(status_code=404, detail=f"File {id} not found")

# @router.get(
#     "/morpheme/{id}", response_description="Get a single file", tags=["morpheme"]
# )
# async def show_file(id: str, request: Request):
#     if (
#         file := await request.app.mongodb["morpheme"].find_one({"_id": id})
#     ) is not None:
#         return file
#     raise HTTPException(status_code=404, detail=f"File {id} not found")

# # delete file by ID ============================================
# @router.delete("/cohesion/{id}", response_description="Delete file", tags=["cohesion"])
# async def delete_file_cohesion(id: str, request: Request):
#     delete_result = await request.app.mongodb["cohesion"].delete_one({"_id": id})
#     if delete_result.deleted_count == 1:
#         return Response(status_code=204)
#     raise HTTPException(status_code=404, detail=f"Task {id} not found")

# # delete file by ID ============================================
# @router.delete("/morpheme/{id}", response_description="Delete file", tags=["morpheme"])
# async def delete_file_morpheme(id: str, request: Request):
#     delete_result = await request.app.mongodb["morpheme"].delete_one({"_id": id})
#     if delete_result.deleted_count == 1:
#         return Response(status_code=204)
#     raise HTTPException(status_code=404, detail=f"Task {id} not found")