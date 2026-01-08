# 도커 실행 가이드 (프론트/백엔드/DB)

## 목표
- 한 번의 스크립트로 프론트엔드, 백엔드, MongoDB를 도커에서 실행/중지/재시작.
- 로컬 포트 충돌 최소화, 환경 변수 파일만 바꿔서 설정 가능.

## 구성 개요
- `docker-compose.yml`: 세 컨테이너(frontend, backend, mongo) 정의 및 공통 네트워크.
- `frontend/Dockerfile`: Node 20 기반 빌드 → 정적 파일을 Nginx 없이 `serve`로 배포.
- `backend/Dockerfile`: PyTorch CUDA 런타임 기반 FastAPI 이미지, gunicorn+uvicorn 워커로 실행.
- `scripts/docker-stack.sh`: `start | stop | restart | logs | ps | build` 명령 제공.
- `.env.docker.example`: 도커 전용 환경 변수 샘플(실제 값은 `.env.docker`로 복사 후 수정).

## 환경 변수(샘플)
- `FRONTEND_PORT`: 호스트에서 접근할 프론트 포트(기본 3800).
- `BACKEND_PORT`: FastAPI 서비스 포트(기본 8000).
- `REACT_APP_API_URI`: 프론트 → 백엔드 API 주소(`http://localhost:${BACKEND_PORT}/api` 권장).
  - **외부 접근 시**: `http://ai.withrun.co.kr:${BACKEND_PORT}/api`로 설정 후 프론트엔드 재빌드 필요
- `DB_URL`, `DB_NAME`: 백엔드가 접속할 MongoDB 정보(컨테이너 DNS `mongo` 사용).
- `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`: Mongo 루트 계정.
- `OPENAI_API_KEY` 등 외부 키: 빈 값으로 두지 말고 실제 키 입력.
- **Bareun 형태소 분석기 설정** (호스트 머신에서 실행 중인 경우):
  - `BAREUN_HOST`: `host.docker.internal` (Docker 컨테이너에서 호스트 접근용)
  - `BAREUN_PORT`: Bareun 서버 포트 (기본 5656)
  - `BAREUN_API_KEY`: Bareun API 키

## 기본 사용법
1) `.env.docker.example`를 `.env.docker`로 복사 후 값 채우기.
2) `chmod +x scripts/docker-stack.sh`.
3) `./scripts/docker-stack.sh start` 실행 → 빌드 및 서비스 기동.
4) 중지: `./scripts/docker-stack.sh stop`, 재시작: `./scripts/docker-stack.sh restart`.
5) 로그 확인: `./scripts/docker-stack.sh logs`.

## 유의사항
- 첫 빌드는 백엔드 파이썬 패키지(특히 PyTorch) 때문에 시간이 길 수 있음.
- Mongo 데이터는 볼륨(`mongo_data`)에 저장되므로 컨테이너 재시작 시 유지.
- 로컬 포트가 이미 사용 중이면 `.env.docker`에서 포트를 조정한 뒤 다시 실행.
