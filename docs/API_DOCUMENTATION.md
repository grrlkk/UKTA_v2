# UKTA Backend API Documentation

## 🌐 Base URL
```
http://{HOST}:{PORT}/api
```
- Default: `http://localhost:8000/api`
- Production: `http://165.246.44.231:8000/api`

---

## 📚 Table of Contents
1. [Cohesion Analysis API](#1-cohesion-analysis-api)
2. [Morpheme Analysis API](#2-morpheme-analysis-api)
3. [Feedback Generation API](#3-feedback-generation-api)

---

## 1. Cohesion Analysis API

### Base Path: `/api/korcat`

### 1.1 파일 업로드 및 분석 (Upload & Analyze)

**Endpoint:** `POST /api/korcat/cohesion`

**Description:** 텍스트 파일을 업로드하여 응집성 분석 및 에세이 채점을 수행합니다.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  ```
  files: List[UploadFile]  # .txt 파일들
  ```

**Response:**
```json
{
  "filenames": ["file1.txt", "file2.txt"]
}
```

**저장 데이터 (MongoDB):**
```json
{
  "_id": "2025-10-02-10:30:45-C100",
  "upload_date": "2025-10-02T10:30:45",
  "process_time": 2.34,
  "filename": "essay.txt",
  "contents": "원본 텍스트...",
  "results": {
    "extracted_features": { /* 29개 자질 */ },
    "essay_score": {
      "grammar": 4.5,
      "vocabulary": 4.2,
      "sentence_expression": 4.0,
      "inter_paragraph_structure": 3.8,
      "intra_paragraph_structure": 4.1,
      "structural_consistency": 4.3,
      "length": 5.0,
      "topic_clarity": 4.6,
      "originality": 3.9,
      "prompt_comprehension": 4.4,
      "narrative": 4.2,
      "text": "원본 텍스트",
      "feat29": { /* 자질 상세 데이터 */ },
      "top_k_features": ["feature1", "feature2", ...]
    }
  }
}
```

**Process Flow:**
1. 형태소 분석 및 자질 추출
2. KoBERT + GRU 모델을 통한 11개 루브릭 채점
3. MongoDB에 결과 저장

---

### 1.2 전체 파일 목록 조회 (List All Files)

**Endpoint:** `GET /api/korcat/cohesion`

**Description:** 저장된 모든 분석 결과를 조회합니다 (최대 100개).

**Response:**
```json
[
  {
    "_id": "2025-10-02-10:30:45-C100",
    "upload_date": "2025-10-02T10:30:45",
    "process_time": 2.34,
    "filename": "essay.txt",
    "contents": "...",
    "results": { /* 전체 분석 결과 */ }
  },
  ...
]
```

---

### 1.3 간단한 파일 목록 조회 (List Simple)

**Endpoint:** `GET /api/korcat/cohesion/simple`

**Description:** 메타데이터만 포함한 간단한 목록을 조회합니다 (results 제외).

**Response:**
```json
[
  {
    "_id": "2025-10-02-10:30:45-C100",
    "upload_date": "2025-10-02T10:30:45",
    "process_time": 2.34,
    "filename": "essay.txt",
    "contents": "원본 텍스트..."
  },
  ...
]
```

---

### 1.4 특정 파일 조회 (Get Single File)

**Endpoint:** `GET /api/korcat/cohesion/{id}`

**Path Parameters:**
- `id` (string): 파일 ID (예: `2025-10-02-10:30:45-C100`)

**Response:**
```json
{
  "_id": "2025-10-02-10:30:45-C100",
  "upload_date": "2025-10-02T10:30:45",
  "process_time": 2.34,
  "filename": "essay.txt",
  "contents": "...",
  "results": { /* 전체 분석 결과 */ }
}
```

**Error Response (404):**
```json
{
  "detail": "File 2025-10-02-10:30:45-C100 not found"
}
```

---

### 1.5 파일 삭제 (Delete File)

**Endpoint:** `DELETE /api/korcat/cohesion/{id}`

**Path Parameters:**
- `id` (string): 삭제할 파일 ID

**Response:**
- **Success:** HTTP 204 No Content
- **Error (404):**
```json
{
  "detail": "Task {id} not found"
}
```

---

## 2. Morpheme Analysis API

### Base Path: `/api/korcat`

### 2.1 형태소 분석 파일 업로드

**Endpoint:** `POST /api/korcat/morpheme`

**Description:** 텍스트 파일을 업로드하여 형태소 분석을 수행합니다 (Bareun 형태소 분석기 사용).

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  ```
  files: List[UploadFile]
  ```

**Response:**
```json
{
  "filenames": ["file1.txt"]
}
```

**저장 데이터:**
```json
{
  "_id": "2025-10-02-10:35:00-M100",
  "upload_date": "2025-10-02T10:35:00",
  "process_time": 0.45,
  "filename": "text.txt",
  "contents": "원본 텍스트",
  "sentences": ["문장1", "문장2", ...],
  "results": { /* Bareun 형태소 분석 JSON */ }
}
```

---

### 2.2 형태소 분석 목록 조회

**Endpoint:** `GET /api/korcat/morpheme`

**Response:** 전체 형태소 분석 결과 목록 (최대 100개)

---

### 2.3 특정 형태소 분석 조회

**Endpoint:** `GET /api/korcat/morpheme/{id}`

**Path Parameters:**
- `id` (string): 파일 ID

---

### 2.4 형태소 분석 삭제

**Endpoint:** `DELETE /api/korcat/morpheme/{id}`

**Path Parameters:**
- `id` (string): 삭제할 파일 ID

---

## 3. Feedback Generation API

### Base Path: `/api/feedback`

### 3.1 AI 피드백 생성 (Generate Feedback)

**Endpoint:** `POST /api/feedback/generate`

**Description:** 에세이 원문과 채점 결과를 기반으로 AI 피드백을 생성합니다.

**Request Model: `GenerateRequest`**
```json
{
  "original_text": "에세이 원문 텍스트",

  // Option A: 원시 데이터 입력 (서버에서 계산)
  "feat29": { /* 29개 자질 딕셔너리 */ },
  "rubric_scores": {
    "grammar": 4.5,
    "vocabulary": 4.2,
    "sentence_expression": 4.0,
    // ... 11개 루브릭
  },
  "top_k_features": ["feature1", "feature2", ...],

  // Option B: 이미 계산된 값 (우선 사용)
  "target_rubrics": ["grammar", "vocabulary"],
  "elite_gaps": [
    {
      "feat_name": "feature1",
      "user_val": 0.5,
      "elite_val": 0.8,
      "gap": 0.3,
      "desc": "설명"
    }
  ],

  // 기타
  "meta": { /* 메타데이터 */ }
}
```

**Response Model: `GenerateResponse`**
```json
{
  "final_md": "# 피드백 마크다운\n\n...",
  "final_markdown": "# 피드백 마크다운\n\n...",  // 프론트 호환
  "ai_md": "# 피드백 마크다운\n\n...",          // 레거시 호환
  "ai_json": {
    "summary": "전체 요약",
    "issues": [
      {
        "rubric": "grammar",
        "issue": "문제점",
        "severity": "high"
      }
    ],
    "action_plan": ["개선방안1", "개선방안2"],
    "sample_edits": [
      {
        "before": "원래 문장",
        "after": "수정된 문장",
        "reason": "수정 이유"
      }
    ],
    "reasoning_brief": ["근거1", "근거2"],
    "one_liner": "한 줄 요약"
  },
  "meta": { /* 에코된 메타데이터 */ },
  "draft": "{ /* JSON 문자열 */ }",
  "target_rubrics": ["grammar", "vocabulary"],
  "elite_gaps_preview": [ /* elite_gaps 데이터 */ ]
}
```

**Process Flow:**
1. **입력 검증**: `original_text` 필수
2. **Selector 단계** (필요 시):
   - `feat29` + `rubric_scores` → `target_rubrics` (개선 필요 루브릭 선정)
   - 우수 에세이와 비교하여 `elite_gaps` 계산
3. **Generator 단계** (LLM):
   - OpenAI GPT-4o-mini 사용
   - 프롬프트 생성 → LLM 호출 → JSON 파싱
4. **Verifier 단계** (서버):
   - LLM 재호출 없이 서버에서 최종 마크다운 조립
5. **응답 반환**: 프론트엔드 호환성을 위해 여러 키로 중복 제공

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "detail": "original_text가 비어 있습니다."
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "detail": "selector 계산 실패: {error_message}"
  }
  ```

---

## 🔧 환경 변수

**Backend `.env` 파일:**
```bash
# OpenAI 설정
OPENAI_API_KEY=sk-...
OPENAI_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.2

# MongoDB 설정
DB_URL=mongodb://kdd:kddnumber1@localhost:3633
DB_NAME=ukta

# 서버 설정
HOST=0.0.0.0
PORT=8000
DEBUG_MODE=False
```

---

## 🚀 사용 예시

### Python 예시

```python
import requests

BASE_URL = "http://localhost:8000/api"

# 1. 파일 업로드 및 분석
with open("essay.txt", "rb") as f:
    files = {"files": ("essay.txt", f, "text/plain")}
    response = requests.post(f"{BASE_URL}/korcat/cohesion", files=files)
    print(response.json())

# 2. 특정 파일 조회
file_id = "2025-10-02-10:30:45-C100"
response = requests.get(f"{BASE_URL}/korcat/cohesion/{file_id}")
data = response.json()

# 3. AI 피드백 생성
feedback_req = {
    "original_text": data["contents"],
    "feat29": data["results"]["essay_score"]["feat29"],
    "rubric_scores": {
        "grammar": data["results"]["essay_score"]["grammar"],
        "vocabulary": data["results"]["essay_score"]["vocabulary"],
        # ... 나머지 루브릭
    },
    "top_k_features": data["results"]["essay_score"]["top_k_features"]
}
response = requests.post(f"{BASE_URL}/feedback/generate", json=feedback_req)
feedback = response.json()
print(feedback["final_markdown"])
```

### JavaScript/Fetch 예시

```javascript
const BASE_URL = "http://localhost:8000/api";

// 1. 파일 업로드
const formData = new FormData();
formData.append("files", fileInput.files[0]);

const uploadResponse = await fetch(`${BASE_URL}/korcat/cohesion`, {
  method: "POST",
  body: formData
});

// 2. 파일 목록 조회
const listResponse = await fetch(`${BASE_URL}/korcat/cohesion`);
const files = await listResponse.json();

// 3. AI 피드백 생성
const feedbackResponse = await fetch(`${BASE_URL}/feedback/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    original_text: "에세이 텍스트...",
    feat29: { /* ... */ },
    rubric_scores: { /* ... */ },
    top_k_features: []
  })
});
const feedback = await feedbackResponse.json();
console.log(feedback.final_markdown);
```

---

## 📊 데이터 모델

### Rubric Scores (11개 평가 항목)
1. `grammar` - 문법
2. `vocabulary` - 어휘
3. `sentence_expression` - 문장 표현
4. `inter_paragraph_structure` - 문단 간 구조
5. `intra_paragraph_structure` - 문단 내 구조
6. `structural_consistency` - 구조적 일관성
7. `length` - 길이
8. `topic_clarity` - 주제 명확성
9. `originality` - 독창성
10. `prompt_comprehension` - 프롬프트 이해도
11. `narrative` - 서사성

### Feature 29 (feat29)
- 29개의 자질로 구성된 딕셔너리
- 에세이의 언어학적 특성을 수치화
- 형태소 분석 및 통계적 특징 추출

---

## 🔒 CORS 설정

허용된 Origin:
- `http://165.246.44.231:3000`
- `http://165.246.44.231:3030`
- `http://localhost`
- `http://localhost:3000`
- `http://localhost:8000`

**Credentials:** Allowed
**Methods:** All
**Headers:** All

---

## ⚠️ 주의사항

1. **cohesion/api.py의 `/score` 엔드포인트**는 현재 `main.py`에 마운트되지 않아 사용 불가능합니다.
2. 파일 업로드 시 `.txt` 파일만 권장됩니다.
3. MongoDB 최대 조회 개수는 100개로 제한됩니다.
4. OpenAI API 타임아웃은 30초로 설정되어 있습니다.
5. 피드백 생성 시 `original_text`는 필수 필드입니다.

---

## 📝 버전 정보

- **API Version:** 2.0
- **Last Updated:** 2025-10-02
- **Framework:** FastAPI
- **Python Version:** 3.8+
