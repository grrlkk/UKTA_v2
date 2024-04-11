import datetime
import json
import os
from typing import List

import pydantic
from apps.cohesion.process import process
from apps.morph.morph import mecab
from bson import ObjectId
from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from fastapi.responses import JSONResponse

# pydantic.json.ENCODERS_BY_TYPE[ObjectId] = str
router = APIRouter()
morph = mecab()


# POST: upload multiple .txt files =============================
@router.post("/cohesion")
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
            "contents": contents,
            "results": results,
        }
        cnt += 1

        new_file = await request.app.mongodb["cohesion"].insert_one(upload)
        created_file = await request.app.mongodb["cohesion"].find_one({"_id": new_file.inserted_id})

    return {"filenames": [file.filename for file in files]}


@router.post("/morpheme")
async def upload_files(request: Request, files: List[UploadFile] = File(...)):
    cnt = 100

    # make object for each file uploaded
    for file in files:
        contents = await file.read()

        print(file.filename)
        print(contents.decode("UTF8"))

        now = datetime.datetime.now()

        # process the uploaded text
        temp = morph.pos(contents.decode("UTF8"))
        temp_full = morph.parse(contents.decode("UTF8"))

        results = []
        results_full = []

        bef = 0

        for index in range(len(temp)):
            if temp[index][1] == "SF":
                results.append(temp[bef : index + 1])
                results_full.append(temp_full[bef : index + 1])
                bef = index + 1
            elif index == len(temp) - 1:
                results.append(temp[bef : index + 1])
                results_full.append(temp_full[bef : index + 1])

        process_time = datetime.datetime.now() - now

        # each object being uploaded to MONGODB
        upload = {
            "_id": now.strftime("%Y-%m-%d-%H:%M:%S") + "-M" + str(cnt),
            "upload_date": now,
            "process_time": process_time.total_seconds(),
            "filename": file.filename,
            "contents": contents,
            "results": results,
            "results_full": results_full,
        }
        cnt += 1

        new_file = await request.app.mongodb["morpheme"].insert_one(upload)
        created_file = await request.app.mongodb["morpheme"].find_one({"_id": new_file.inserted_id})

    return {"filenames": [file.filename for file in files]}


# GET: list all files; list file by ID =========================
@router.get("/cohesion", response_description="List all files")
async def list_files(request: Request):
    files = []

    for doc in await request.app.mongodb["cohesion"].find().to_list(length=100):
        files.append(doc)
    return files


@router.get("/morpheme", response_description="List all files")
async def list_files(request: Request):
    files = []

    for doc in await request.app.mongodb["morpheme"].find().to_list(length=100):
        files.append(doc)
    return files


@router.get("/cohesion/{id}", response_description="Get a single file")
async def show_file(id: str, request: Request):
    if (file := await request.app.mongodb["cohesion"].find_one({"_id": id})) is not None:
        return file

    raise HTTPException(status_code=404, detail=f"File {id} not found")


@router.get("/morpheme/{id}", response_description="Get a single file")
async def show_file(id: str, request: Request):
    if (file := await request.app.mongodb["morpheme"].find_one({"_id": id})) is not None:
        return file

    raise HTTPException(status_code=404, detail=f"File {id} not found")


# delete file by ID ============================================
@router.delete("/cohesion/{id}", response_description="Delete file")
async def delete_file(id: str, request: Request):
    delete_result = await request.app.mongodb["cohesion"].delete_one({"_id": id})

    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content={"message": "File deleted successfully"})

    raise HTTPException(status_code=404, detail=f"Task {id} not found")


# delete file by ID ============================================
@router.delete("/morpheme/{id}", response_description="Delete file")
async def delete_file(id: str, request: Request):
    delete_result = await request.app.mongodb["morpheme"].delete_one({"_id": id})

    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content={"message": "File deleted successfully"})

    raise HTTPException(status_code=404, detail=f"Task {id} not found")
