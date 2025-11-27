## /analysis 응답 불가 현상 요약 (2025-02-26)

- **문제**: `http://localhost:3800/analysis` 화면에서 API 호출이 모두 실패해 로딩만 보임.
- **원인**: 백엔드 컨테이너가 FastAPI 업로드 엔드포인트 의존 패키지(`python-multipart`) 미설치로 부팅에 반복 실패.
- **영향**: 프런트엔드가 `http://localhost:8000/api/...`로 보내는 모든 요청이 연결 거부되어 기능 사용 불가.
- **대응 계획**
  1. 백엔드 `requirements.txt`에 `python-multipart`를 명시 추가.
  2. 백엔드 이미지를 재빌드하고 컨테이너 재기동해 헬스 확인.
  3. 프런트 `/analysis` 화면에서 API 응답 정상 여부를 Playwright로 재확인하고 기본 테스트 실행.

- **현재 상태(2025-02-26)**: `python-multipart` 추가 후 백엔드 재빌드·재기동 완료, `/analysis`에서 API 연결 거부 오류 사라짐 확인.

---

## MongoDB 데이터 로딩 및 Bareun 서버 연결 문제 (2025-02-26)

### 문제 상황
- **증상**: `http://localhost:3800/analysis` 페이지에서 "Loading" 상태에 머물며 데이터가 표시되지 않음
- **API 응답**: `GET /api/korcat/cohesion` 엔드포인트가 빈 배열 `[]` 반환
- **근본 원인**: MongoDB가 비어있음 + Bareun 형태소 분석기 서버 연결 실패

### 세부 문제 분석

#### 1. MongoDB 빈 데이터베이스
- MongoDB 연결은 정상이지만 `cohesion` 컬렉션에 데이터가 없음
- 테스트 데이터 업로드 시도 시 500 Internal Server Error 발생

#### 2. Bareun 서버 연결 실패
- **에러 메시지**:
  ```
  서버에 연결할 수 없습니다. 입력한 서버주소 [localhost:5656]가 정확한지 확인해 주세요.
  서버 메시지: failed to connect to all addresses; last error: UNKNOWN: ipv4:127.0.0.1:5656: Failed to connect to remote host: connect: Connection refused (111)
  ```
- **원인**: Docker 컨테이너 내부에서 `localhost:5656`으로 접근 시도했으나, Bareun 서버는 호스트 머신에서 실행 중
- **문제**: Docker 네트워크 격리로 인해 컨테이너가 호스트의 `localhost` 서비스에 접근 불가

### 해결 방법

#### 1. Bareun 서버 연결 설정 수정
`.env.docker` 파일에 다음 환경 변수 추가:
```bash
# Bareun 형태소 분석기
BAREUN_HOST=host.docker.internal
BAREUN_PORT=5656
BAREUN_API_KEY=koba-QUS4QWA-2ASEQVQ-U55HLPY-R2E5UOA
```

**핵심 포인트**: `host.docker.internal`을 사용하여 Docker 컨테이너에서 호스트 머신의 서비스에 접근

#### 2. 백엔드 컨테이너 재생성
```bash
docker compose --env-file .env.docker up -d --force-recreate backend
```

**주의**: `restart` 대신 `--force-recreate` 사용해야 환경 변수가 새로 로드됨

#### 3. 테스트 데이터 업로드
```bash
# 테스트 파일 생성
cat > /tmp/sample_text.txt << 'EOF'
안녕하세요. 이것은 테스트 텍스트입니다.
한국어 텍스트 분석을 위한 샘플 문장입니다.
응집성 분석과 형태소 분석이 정상적으로 작동하는지 확인하기 위한 예제입니다.
EOF

# 데이터 업로드
curl -X POST http://localhost:8000/api/korcat/cohesion \
  -F "files=@/tmp/sample_text.txt"
```

#### 4. 검증
- MongoDB 데이터 확인: `docker exec ukta_backend python3 -c "..."`
- Playwright 테스트로 UI 확인

### 결과
- ✅ Bareun 서버 연결 성공
- ✅ 데이터 업로드 성공
- ✅ `/analysis` 페이지에서 데이터 정상 표시
- ✅ 응집성 분석 기능 정상 작동

---

## 외부 접근 설정 (2025-02-26)

### 요구사항
- 외부 도메인 `ai.withrun.co.kr:3800`으로 접근 가능하도록 설정
- Playwright MCP를 활용한 외부 접근 테스트

### 구현

#### 1. CORS 설정 확인
`backend/main.py:28-38`에 이미 외부 도메인이 포함되어 있음을 확인:
```python
origins = [
    "http://ai.withrun.co.kr:3800",
    "http://ai.withrun.co.kr:8000",
    # ... 기타 origins
]
```

#### 2. 프론트엔드 API URI 변경
`.env.docker` 파일 수정:
```bash
# Before
REACT_APP_API_URI=http://localhost:8000/api

# After
REACT_APP_API_URI=http://ai.withrun.co.kr:8000/api
```

**중요**: `REACT_APP_*` 환경 변수는 빌드 타임에 React 앱에 포함되므로 프론트엔드 재빌드 필요

#### 3. 프론트엔드 컨테이너 재빌드
```bash
docker compose --env-file .env.docker -f docker-compose.yml up -d --build frontend
```

### 검증 결과

#### Playwright 테스트
- URL: `http://ai.withrun.co.kr:3800/analysis`
- 페이지 로딩: ✅ 성공
- 데이터 표시: ✅ "1. sample_text.txt" 정상 표시
- 네트워크 요청:
  - `GET http://ai.withrun.co.kr:8000/api/korcat/cohesion` → 200 OK
  - 응답 데이터 정상 수신
- 스크린샷: `.playwright-mcp/external-access-final-verification.png`

### 최종 상태
- ✅ 로컬 접근 (`localhost:3800`) 정상
- ✅ 외부 접근 (`ai.withrun.co.kr:3800`) 정상
- ✅ 모든 기능 정상 작동
- ✅ Bareun 형태소 분석기 연동 정상
