# UKTA 에세이 채점 루브릭 가이드

## 개요

UKTA(Universal Korean Text Analyzer)는 한국어 에세이를 **11개 루브릭**으로 자동 채점하는 시스템입니다. 백엔드 모델은 11개 루브릭을 모두 채점하지만, 프론트엔드에서는 **8개 루브릭**만 표시하고 총점 계산에 반영합니다.

---

## 루브릭 구성

### 전체 11개 루브릭

| 영문 키 | 한글명 | 카테고리 | UI 표시 |
|---------|--------|----------|---------|
| `grammar` | 문법 | 표현 | ✅ |
| `vocabulary` | 어휘 | 표현 | ✅ |
| `sentence_expression` | 문장 표현 | 표현 | ✅ |
| `intra_paragraph_structure` | 문단 내 구조 | 조직 | ✅ |
| `inter_paragraph_structure` | 문단 간 구조 | 조직 | ✅ |
| `structural_consistency` | 구조적 일관성 | 조직 | ❌ 제외 |
| `length` | 분량 | 기본 | ❌ 제외 |
| `topic_clarity` | 주제 명확성 | 내용 | ✅ |
| `originality` | 독창성 | 내용 | ✅ |
| `prompt_comprehension` | 프롬프트 이해도 | 내용 | ❌ 제외 |
| `narrative` | 서사/전개 | 내용 | ✅ |

### 제외 루브릭 (3개)

| 루브릭 | 제외 이유 |
|--------|-----------|
| `structural_consistency` | 다른 조직 루브릭과 중복 평가 요소 |
| `length` | 정량적 지표로 별도 통계에서 제공 |
| `prompt_comprehension` | 프롬프트 없는 자유 글쓰기에서 평가 불가 |

---

## 점수 체계

### 채점 모델 출력

백엔드 GRU 모델은 각 루브릭에 대해 **0~3 범위의 정수**를 출력합니다.

```python
# essay_scoring.py
output = np.rint(logits[0].cpu().numpy() * 3).astype(int)  # 0~1 → 0~3 라운딩
```

### 원점수 (Raw Score)

모델 출력(0~3)을 루브릭별 만점으로 스케일링합니다.

| 카테고리 | 루브릭 | 모델 출력 | 원점수 범위 |
|----------|--------|-----------|-------------|
| **표현** | grammar | 0~3 | 0~6점 |
| | vocabulary | 0~3 | 0~6점 |
| | sentence_expression | 0~3 | 0~6점 |
| **조직** | intra_paragraph_structure | 0~3 | 0~15점 |
| | inter_paragraph_structure | 0~3 | 0~15점 |
| **내용** | topic_clarity | 0~3 | 0~15점 |
| | originality | 0~3 | 0~15점 |
| | narrative | 0~3 | 0~15점 |

**참고**: 모델 출력 0~3이 원점수로 변환되는 방식:
- 표현 영역: 출력값 × 2 = 원점수 (0, 2, 4, 6)
- 조직/내용 영역: 출력값 × 5 = 원점수 (0, 5, 10, 15)

---

## 총점 계산 (100점 만점)

### 계산 공식

```
총점 = 내용 점수 + 조직 점수 + 표현 점수 + 기본 점수
     = (topic_clarity + narrative + originality) + (intra + inter) + (grammar + vocabulary + sentence) + 7
```

### 영역별 배점

| 영역 | 루브릭 | 원점수 합계 | 기본 점수 | 영역 총점 |
|------|--------|-------------|-----------|-----------|
| **내용** | topic_clarity (15) + narrative (15) + originality (15) | 45점 | +5점 | **50점** |
| **조직** | intra_paragraph_structure (15) + inter_paragraph_structure (15) | 30점 | - | **30점** |
| **표현** | grammar (6) + vocabulary (6) + sentence_expression (6) | 18점 | +2점 | **20점** |
| **합계** | | 93점 | +7점 | **100점** |

### 기본 점수 (Bonus)

- **내용 영역**: +5점 (기본 부여)
- **표현 영역**: +2점 (기본 부여)
- **총 기본 점수**: +7점

### 계산 예시

```
예시: 모델 출력이 모두 2인 경우

[내용]
- topic_clarity: 2 × 5 = 10점
- narrative: 2 × 5 = 10점
- originality: 2 × 5 = 10점
- 내용 소계: 30점 + 기본 5점 = 35점

[조직]
- intra_paragraph_structure: 2 × 5 = 10점
- inter_paragraph_structure: 2 × 5 = 10점
- 조직 소계: 20점

[표현]
- grammar: 2 × 2 = 4점
- vocabulary: 2 × 2 = 4점
- sentence_expression: 2 × 2 = 4점
- 표현 소계: 12점 + 기본 2점 = 14점

총점: 35 + 20 + 14 = 69점 / 100점
```

---

## 레이더 차트 정규화

프론트엔드 레이더 차트는 각 루브릭을 0~1 범위로 정규화하여 표시합니다.

### 정규화 공식

```javascript
정규화 값 = 원점수 / 원점수 최대값
```

### 레이더 축 순서 (8개)

1. Clarity (topic_clarity) - 주제 명확성
2. Originality (originality) - 독창성
3. Narrative (narrative) - 서사/전개
4. In-Paragraph (intra_paragraph_structure) - 문단 내 구조
5. Inter-Paragraph (inter_paragraph_structure) - 문단 간 구조
6. Grammar (grammar) - 문법
7. Vocabulary (vocabulary) - 어휘
8. Sentence (sentence_expression) - 문장 표현

---

## 코드 참조

### 백엔드 (채점 모델)

**파일**: `backend/apps/cohesion/essay_scoring/essay_scoring.py`

```python
# 11개 루브릭 정의
rubric = [
    "grammar", "vocabulary", "sentence_expression",
    "inter_paragraph_structure", "intra_paragraph_structure",
    "structural_consistency", "length",
    "topic_clarity", "originality", "prompt_comprehension", "narrative",
]

# 모델 출력 (output_dim=11)
gru_model = GRUScoreModuleWithLNUKTAAttention(
    output_dim=11,
    hidden_dim=256,
    ukt_a_dim=ukt_a_dim,
    dropout=0.5,
)
```

### 프론트엔드 (점수 표시)

**파일**: `frontend/src/pages/cohesion/EvalFormat.jsx`

```javascript
// 원점수 최대값
const MAX_SCORES = {
  grammar: 6,
  vocabulary: 6,
  sentence_expression: 6,
  intra_paragraph_structure: 15,
  inter_paragraph_structure: 15,
  topic_clarity: 15,
  originality: 15,
  narrative: 15,
};

// 제외 항목
const EXCLUDED_KEYS = ["structural_consistency", "length"];
// prompt_comprehension은 GROUPS에 미포함으로 자동 제외

// 표시 순서
const GROUPS = [
  { keys: ["topic_clarity", "narrative", "originality"] },           // 내용
  { keys: ["intra_paragraph_structure", "inter_paragraph_structure"] }, // 조직
  { keys: ["grammar", "vocabulary", "sentence_expression"] },        // 표현
];

// 기본 점수
const TOTAL_BONUS = 7;  // 내용 +5, 표현 +2

// 총점 계산
const computeTotalAdjustedScore = (essayScore) =>
  ORDERED_KEYS.reduce((a, k) => a + essayScore[k], 0) + TOTAL_BONUS;
```

---

## 요약

| 항목 | 값 |
|------|-----|
| 백엔드 채점 루브릭 | 11개 |
| 프론트엔드 표시 루브릭 | 8개 |
| 제외 루브릭 | structural_consistency, length, prompt_comprehension |
| 총점 만점 | 100점 |
| 기본 점수 | +7점 (내용 +5, 표현 +2) |
| 모델 출력 범위 | 0~3 (정수) |
