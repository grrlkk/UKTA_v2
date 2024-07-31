import datetime
from typing import List

import apps.cohesion.textpreprocess as tp
from apps.cohesion.process import process
from apps.morph.morph import mecab
from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile

# pydantic.json.ENCODERS_BY_TYPE[ObjectId] = str
router = APIRouter()
morph = mecab()


# POST: upload multiple .txt files =============================
@router.post("/cohesion", tags=["cohesion"])
async def upload_files(request: Request, files: List[UploadFile] = File(...)):
    cnt = 100

    # make object for each file uploaded
    for file in files:
        contents = await file.read()

        print(file.filename)
        print(contents.decode("UTF8"))

        now = datetime.datetime.now()

        # process the uploaded text
        results = process(contents.decode("UTF8"))

        process_time = datetime.datetime.now() - now

        # each object being uploaded to MONGODB
        upload = {
            "_id": now.strftime("%Y-%m-%d-%H:%M:%S") + "-C" + str(cnt),
            "upload_date": now,
            "process_time": process_time.total_seconds(),
            "filename": file.filename,
            "contents": contents.decode("UTF8"),
            "results": results,
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

        results = []
        results_full = []

        for index in range(len(sentences)):
            morph_result = morph.pos(sentences[index])
            if len(morph_result) > 0:
                results.append(morph_result)
                results_full.append(morph.parse(sentences[index]))

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
            "results_full": results_full,
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
