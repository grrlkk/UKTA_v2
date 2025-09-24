# /home/ttytu/projects/KorCAT-web copy/backend/main.py
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from apps.routers import router
from apps.feedback.api import router as feedback_router
from config import settings
from apps.cohesion.process import initialize_models

# ===== Lifespan (startup/shutdown 대체) =====
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    app.mongodb_client = AsyncIOMotorClient(settings.DB_URL)
    app.mongodb = app.mongodb_client[settings.DB_NAME]
    initialize_models()

    yield  # 애플리케이션 실행 구간

    # shutdown
    app.mongodb_client.close()

app = FastAPI(root_path="/api", lifespan=lifespan)

# ===== CORS =====
origins = [
    "http://165.246.44.231:3000",
    "http://165.246.44.231:3030",
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # '*' 대신 명시 목록 권장 (credentials 함께 사용할 때 표준 준수)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Router =====
app.include_router(router, prefix="/korcat")
app.include_router(feedback_router)

# 로컬에서 uvicorn 단독 실행할 때만 사용 (gunicorn 사용 시엔 무시됨)
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        reload=settings.DEBUG_MODE,
        port=settings.PORT,
    )





# import uvicorn
# from apps.routers import router
# from config import settings
# from fastapi import FastAPI
# from apps.cohesion.process import initialize_models

# from fastapi.middleware.cors import CORSMiddleware
# from motor.motor_asyncio import AsyncIOMotorClient

# app = FastAPI(root_path="/api")


# # include local origins including react ========================
# origins = [
#     "http://165.246.44.231:3000",  # Add your frontend URL here
#     "http://165.246.44.231:3030",
#     "http://localhost",
#     "http://localhost:3000",
#     "http://localhost:8000",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # mongodb client startup & connect with DB server ==============
# @app.on_event("startup")
# async def startup_db_client():
# 	app.mongodb_client = AsyncIOMotorClient(settings.DB_URL)
# 	app.mongodb = app.mongodb_client[settings.DB_NAME]
# 	initialize_models()


# @app.on_event("shutdown")
# async def shutdown_db_client():
# 	app.mongodb_client.close()


# # include file routers & run ===================================
# app.include_router(router, prefix="/korcat")


# if __name__ == "__main__":
#     uvicorn.run(
#         "main:app",
#         host=settings.HOST,
#         reload=settings.DEBUG_MODE,
#         port=settings.PORT,
#     )








