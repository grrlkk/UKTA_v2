# /home/ukta/KorCAT-web_v2/backend/apps/feedback/prompt_feedback.py

from __future__ import annotations
import json, re
from typing import Any, Dict, List

# ============================================================
# 1. 공용 유틸리티 (기존 유지)
# ============================================================
def extract_text(resp: Dict[str, Any]) -> str:
    if not isinstance(resp, dict): return ""
    if resp.get("output_text"): return resp["output_text"]
    if resp.get("output"):
        for blk in resp["output"]:
            for c in blk.get("content", []):
                if isinstance(c, dict) and "text" in c: return c["text"]
    if resp.get("choices"):
        msg = resp["choices"][0].get("message", {})
        if "content" in msg and isinstance(msg["content"], str): return msg["content"]
    if isinstance(resp.get("content"), str): return resp["content"]
    return ""

def safe_json(text: str) -> Dict[str, Any]:
    if not text: return {}
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.S)
    m = re.search(r"\{.*\}", t, flags=re.S)
    if m: t = m.group(0)
    t = re.sub(r"//.*?$", "", t, flags=re.M)
    try: return json.loads(t)
    except Exception: return {}

def ensure_json_string(obj_or_str: Any) -> str:
    if isinstance(obj_or_str, dict): return json.dumps(obj_or_str, ensure_ascii=False)
    if isinstance(obj_or_str, str):
        js = safe_json(obj_or_str)
        if js: return json.dumps(js, ensure_ascii=False)
        return "{}"
    return "{}"

# ============================================================
# 2. [핵심] 선생님 페르소나 프롬프트 (English Instructions)
# ============================================================
TEMPLATE_TEACHER = """
You are a **professional Korean writing tutor** known for being warm, insightful, and pedagogical.
Your task is to analyze the [Student Essay] based on the provided [Diagnostic Guide] and generate **3 high-quality feedback points** in a JSON format.

[Input Data]
1. Student Essay (Korean):
{original_text}

2. Diagnostic Guide (Korean Analysis from Algorithms):
{diagnostic_guide}

[Instructions]
1. **Follow the Diagnostic Guide**: Use the 'Teacher's Advice' from the [Diagnostic Guide] to formulate your feedback.
   - Example: If the guide says "Increase connectives," find a specific sentence in the essay that lacks flow and suggest adding a connective.
2. **Context is King (Human-in-the-loop)**: The algorithm lacks context. If a point in the [Diagnostic Guide] feels awkward or unnecessary given the essay's flow, **ignore it** and focus on making the writing natural.
3. **Concrete Examples**: Abstract advice is forbidden. You MUST provide a **[Before] -> [After]** comparison using the student's actual sentences.
**Tone & Style Strategy (CRITICAL)**:
   - **Feedback Commentary** (summary, why, suggestion): Use a **warm, polite tone** (e.g., "~해요", "~면 좋겠어요"). Do not use mechanical phrases like "~함".
   - **Revised Sentences** (edit.after): **STRICTLY PRESERVE the original register** of the student's essay.
     - If the student uses **Plain Form** (e.g., "~한다", "~이다"), your revision MUST use Plain Form.
     - If the student uses **Polite Form** (e.g., "~합니다", "~해요"), your revision MUST use Polite Form.
     - **NEVER** change the essay's tone from formal to casual in the 'edit' section.
5. **No Numeric References**: Never mention raw scores (e.g., "Score is 0.5 lower"). Instead, use qualitative language (e.g., "It would be better to reinforce...").
6. **No Duplicates**: Do NOT target the same sentence twice across different issues. Each of the 3 issues must focus on a DIFFERENT part of the essay.
7. **Strict Relevance Check**: 
   - When selecting the 'before' sentence, you MUST choose a sentence that **actually contains the error** described in the [Diagnostic Guide].
   - Example: If the diagnosis is "Particle Usage," do NOT select a sentence where particles are correct just to fix spacing or spelling. Find a sentence where the particle is actually wrong or missing.
   - If the specific error (e.g., Particle) cannot be found in the entire essay, you may ignore that diagnostic point and select a different issue from the essay based on your own judgment.
[JSON Output Schema]
Return a single JSON object. Do not include markdown formatting like ```json.
{{
  "summary": "A warm overall comment summarizing the essay's strengths and one area for improvement (in Korean).",
  "issues": [
    {{
      "rubric": "Category of the feedback (e.g., 어휘력, 문단 구성) (in Korean)",
      "phenomenon": "Description of the problem in simple terms for the student (in Korean)",
      "why": "Explanation of why this is a problem and the benefit of fixing it (in Korean)",
      "suggestion": "Specific actionable advice based on the guide (in Korean)",
      "edit": {{
        "before": "The exact sentence from the student's essay causing the issue",
        "after": "Your revised version of the sentence"
      }},
      "metric_link": "The feature name from the Diagnostic Guide (e.g., NNG_Ratio)" 
    }}
    // Provide exactly 3 issues, sorted by importance.
  ],
  "one_liner": "One short, encouraging sentence for the student (in Korean)."
}}
"""

# ============================================================
# 3. [핵심] 데이터 변환 함수 (Bridge) - 한국어 가이드 생성
# ============================================================
def format_elite_gaps_to_text(elite_gaps: List[Dict[str, Any]]) -> str:
    """
    Converts the 'elite_gaps' list from selector.py into a readable
    'Teacher's Note' (in Korean) for the LLM to process.
    """
    lines = []
    
    for idx, item in enumerate(elite_gaps, 1):
        feat_name = item.get('feature', 'Unknown')
        label_ko = item.get('label_ko', feat_name)
        value = item.get('value', 0)
        center = item.get('elite_center', 0)
        guide = item.get('guide', {}) 
        
        # 가이드가 없거나 기본값이면 스킵 혹은 기본 정보 출력
        if not guide or guide.get('title') == "일반 가이드":
            lines.append(f"Diagnosis {idx}. {label_ko}: (No specific guide available)")
            continue

        # 부족(Low) vs 과다(High) 판단
        is_low = value < center
        direction_key = "when_low" if is_low else "when_high"
        
        advice_data = guide.get(direction_key, {})
        diagnosis = advice_data.get("diagnosis", "특이 사항 감지")
        actions = advice_data.get("actions", [])
        
        # 액션 아이템 텍스트화
        action_text = ""
        if actions:
            action_text = "   - " + "\n   - ".join(actions)
        
        # LLM에게 보여줄 한국어 진단 가이드 블록
        text_block = f"""
[Diagnosis {idx}: {label_ko} ({feat_name})]
- Status: {diagnosis}
- Teacher's Advice:
{action_text}
- Note: Ignore this if it conflicts with the context.
"""
        lines.append(text_block.strip())

    return "\n\n".join(lines)

# ============================================================
# 4. 프롬프트 생성기 (Generator)
# ============================================================
def create_generator_prompt(original_text: str,
                            target_rubrics: List[str],
                            elite_gaps: List[Dict[str, Any]]) -> str:
    
    # 1. 데이터를 '읽기 쉬운 가이드'로 변환
    diagnostic_text = format_elite_gaps_to_text(elite_gaps)
    
    # 2. 영어 템플릿에 주입
    return TEMPLATE_TEACHER.format(
        original_text=json.dumps(original_text, ensure_ascii=False),
        diagnostic_guide=diagnostic_text
    )

# ============================================================
# 5. [수정됨] 결과 리포트 생성기 (Verifier) - 세로형 배치
# ============================================================
def create_verifier_prompt(original_text: str, draft_json_str: str) -> str:
    try:
        data = json.loads(draft_json_str) if draft_json_str else {}
    except Exception:
        data = {}

    summary = data.get("summary") or ""
    issues: List[Dict[str, Any]] = data.get("issues") or []
    one_liner = data.get("one_liner") or ""

    lines: List[str] = []

    # 1) 종합 진단
    lines.append("## 종합 코멘트")
    lines.append(summary.strip() or "글을 쓰느라 고생 많았어요! 몇 가지만 다듬으면 훨씬 좋은 글이 될 거예요.")
    lines.append("\n---")

    # 2) 핵심 수정 포인트
    lines.append("\n## 집중 첨삭 포인트")
    if issues:
        for it in issues:
            phenomenon = it.get("phenomenon", "수정 제안")
            why = it.get("why", "")
            suggestion = it.get("suggestion", "")
            rubric = it.get("rubric", "작문 조언")
            
            # 표 데이터
            edit = it.get("edit") or {}
            before = edit.get("before") or "(원문)"
            after = edit.get("after") or "(수정안)"

            # 카드 헤더
            lines.append(f"\n### {phenomenon}")
            lines.append(f"* **관련 영역**: `{rubric}`")

            # [세로형 배치] 표 대신 인용구와 볼드체 활용
            lines.append("\n| 구분 | 문장 |")
            lines.append("| :---: | :--- |")
            lines.append(f"| 기존 | {before} |")
            lines.append(f"| 수정 | **{after}** |")

            # 설명 및 제안
            lines.append(f"\n**[왜 고쳐야 할까요?]**")
            lines.append(f"{why}")
            
            lines.append(f"\n**[이렇게 해보세요]**")
            lines.append(f"{suggestion}")

            lines.append("\n---")
    else:
        lines.append("- 특별히 지적할 내용 없이 훌륭합니다!")
        lines.append("\n---")

    return "\n".join(lines)



# from __future__ import annotations
# import json, re
# from typing import Any, Dict, List

# # ------------------------------------------------------------
# # 공용 유틸
# # ------------------------------------------------------------
# def extract_text(resp: Dict[str, Any]) -> str:
#     if not isinstance(resp, dict):
#         return ""
#     if resp.get("output_text"):
#         return resp["output_text"]
#     if resp.get("output"):
#         for blk in resp["output"]:
#             for c in blk.get("content", []):
#                 if isinstance(c, dict) and "text" in c:
#                     return c["text"]
#     if resp.get("choices"):
#         msg = resp["choices"][0].get("message", {})
#         if "content" in msg and isinstance(msg["content"], str):
#             return msg["content"]
#     if isinstance(resp.get("content"), str):
#         return resp["content"]
#     return ""

# def safe_json(text: str) -> Dict[str, Any]:
#     if not text:
#         return {}
#     t = text.strip()
#     t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.S)
#     m = re.search(r"\{.*\}", t, flags=re.S)
#     if m:
#         t = m.group(0)
#     t = re.sub(r"//.*?$", "", t, flags=re.M)
#     try:
#         return json.loads(t)
#     except Exception:
#         return {}

# def ensure_json_string(obj_or_str: Any) -> str:
#     if isinstance(obj_or_str, dict):
#         return json.dumps(obj_or_str, ensure_ascii=False)
#     if isinstance(obj_or_str, str):
#         js = safe_json(obj_or_str)
#         if js:
#             return json.dumps(js, ensure_ascii=False)
#         return "{}"
#     return "{}"




# TEMPLATE_JSON_ONLY = """You are a **Korean linguistics–grounded writing feedback expert**.
# - You MAY reason internally if helpful.
# - DO NOT reveal your reasoning; output **only** the JSON object per the schema (no markdown, no preface, no code fences). 최종적으로 한글로 보여줘.

# [hidden_data]
# target_rubrics: {target_rubrics}
# elite_gaps: {elite_gaps}
# original_text: {original_text}

# [ABSOLUTE RULES]
# 1) **Required fields**: summary, issues[], action_plan[], reasoning_brief[], one_liner
#    - sample_edits[] is optional (not rendered).
#    - Output a **single JSON object**; no extra text/comments/markdown.

# 2) **No scoring/selection by the model**: the server finalized arithmetic/selection.
#    - You ONLY provide rewriting and edit suggestions.
#    - issues MUST be **exactly 3**.
#    - Use **at least 2 distinct metric_link values** across the 3 issues.
#    - Each issues[i].metric_link MUST **exactly string-match** some elite_gaps[].feature.

# 3) **Selection priority (fixed; do NOT compute)**:
#    - (a) Include all items with strength == "강권고" from elite_gaps first.
#    - (b) Fill remaining slots by **descending elite_gaps.score** **with a hard constraint**: prefer features not yet used so that the final set has **≥2 distinct features**. If a tie or only duplicates remain, pick the next highest-scoring **different feature**.
#    - (c) Ensure **≥1 issue aligns with target_rubrics** (via elite_gaps.guide.rubric_hint). If multiple candidates qualify, choose the highest-scoring feature not yet represented.
#    - (d) **Before finalizing**, verify the three issues cover **≥2 distinct metric_link**. If duplicates cannot be avoided from data, say so briefly in `reasoning_brief` and ensure each duplicated issue targets **different phenomena and edits**.

# 4) **Copy-by-value (no computation, no paraphrase)**:
#    - issues[i].metric_current = matching elite_gaps.value (number as is).
#    - issues[i].metric_target = matching elite_gaps.metric_target; if absent, **copy elite_gaps.elite_center**. Do NOT omit this field.
#    - If elite_gaps has status/suggest for that feature, **copy their text verbatim** into corresponding fields (no rewording).

# 5) **Representative evidence (quote from original_text)**:
#    - Read original_text fully and choose the **most salient passage** displaying the problem.
#    - Default: quote **one full sentence**.
#    - If the rubric is **inter_/** or **intra_paragraph_structure**, one-sentence evidence is **invalid**: quote **two or more consecutive sentences** or a **full paragraph**, and set evidence.level = "paragraph".
#    - If the original is too short for two sentences, quote the **entire paragraph or document** and then propose expansions (still set level appropriately).
#    - evidence MUST be: {{"sent_idx": <int>, "span": "<verbatim from original>", "level": "sentence|paragraph|document", "para_idx": <int>}}.
#    - The span MUST be **verbatim** (no ellipses, no normalization). Preserve spacing/punctuation.
#    - `edit.before` MUST be a **substring** of evidence.span.

# 6) **Edit proposal (clearly better while preserving content/voice)**:
#    - edit.before = the **core problematic segment** copied **verbatim** from evidence.span.
#    - edit.after = a revised sentence/short paragraph that improves clarity, cohesion, and correctness while preserving **information, viewpoint, tense, register, and honorifics** of the original.
#    - When expanding for length or detail, **elaborate only on elements present in the original** (who/when/where/sequence); **do not invent new facts, motivations, or events**.
#    - edit.edit_ops MUST include **one or more** of ["치환","삽입","삭제","분할","결합","이동"].
#    - For inter_/intra-structure issues, include **at least two** of these operations (e.g., ["삽입","결합"]) and, when needed, add explicit transitions (예: "그러나/따라서/이때/한편").

# 7) **Use guides without copy-paste**:
#    - If the selected metric_link has elite_gaps[].guide, distill **what_it_means / why_it_matters / when_low/when_high.actions / examples** into your own words in Korean.
#    - DO NOT copy sentences from the guide; **paraphrase while preserving meaning**.

# 8) **Style & quality constraints (Korean output)**:
#    - Use specific nouns/verbs; ensure subject–predicate agreement; correct spelling/spacing.
#    - Preserve the original **register (격식/구어체), viewpoint, tense**, and information content.
#    - **Do not fabricate new facts** or motivations absent in the original text.
#    - **Register check**: if **≥50%** of original sentences end with ‘요/네요/겠어요’ style, keep that style in `edit.after`; **do not switch** to ‘습니다’ endings unless the original is formal.
#    - Avoid vague words: "자연스럽게", "어색함", "좀 더", "등등", "전반적으로".
#    - No emojis/slang. Write all free-text fields in Korean. 최종적으로 한글로 보여줘.

# 9) **Suggestion phrasing (imperative, actionable)**:
#    - Format: **Verb (action) + target + tool/technique** (예: "도입부에 주제문 **삽입** + 전환어(**따라서**)로 본론 연결").
#    - Each `suggestion` MUST be **location-aware** (paragraph/sentence index) and name a **specific device** (transition words like "그러나/따라서/한편/이때", or structural pattern "주장-근거-예시").
#    - **Do NOT specify numeric ranges** (e.g., "+120~180자") or counts; use qualitative scopes instead (예: "문단 분량 확장", "여러 문장 보강", "복수의 근거 추가").

# 10) **User-visible number suppression (critical)**:
#    - In **all free-text fields** (summary, issues[].phenomenon/why/suggestion/expected_effect, action_plan[], reasoning_brief[], one_liner, and any sample_edits text), **DO NOT include Arabic numerals, unit counts, percentages, or explicit metric values** (e.g., "269", "492.6", "673.96", "172.93", "%", "자/단어/문단 수").
#    - Do NOT mention labels like "우수 작문가 평균".
#    - If server-provided numbers inform your reasoning, **convert them into qualitative statements** in Korean (예: "요구 기준에 미달", "정보량이 부족", "문단이 짧아 전개가 끊김").
#    - **Exception**: evidence.span is a verbatim quote; if the original text contains numbers, keep them as is **within evidence.span only**.

# 11) **Type–metric consistency**:
#    - Map `metric_link` to a plausible `type`: structure → `cohesion`/`discourse`; vocabulary/length → `lexicon`; grammar → `syntax`; readability → `readability`. Choose the closest one; avoid mismatches.

# 12) **Output hygiene & validation**:
#    - Output **only** the JSON object; no markdown/code fences/backticks.
#    - No extra keys; keep names exactly as in the schema.
#    - Use "" or [] instead of null. Keep numbers as numbers; do not recompute.
#    - Indexing: sent_idx / para_idx are **0-based**.
#    - Ensure **≥2 distinct metric_link** across issues; if impossible, explain briefly in `reasoning_brief` and differentiate phenomena/edits clearly.
#    - **Self-audit**: Before output, write **3–6 bullet points** to `reasoning_brief` (in Korean) confirming all of the following: distinct `metric_link` ≥ 2; inter_/intra_ evidence is paragraph-level with ≥2 consecutive sentences; `edit.before` ⊂ `evidence.span`; original register preserved; each `suggestion` contains location and a specific device; **no user-visible numerals** are present. If any item fails, **fix and re-audit**, then output.

# 13) **Human-readable rubric label**:
#    - The `rubric` field should be a **Korean, human-readable label** of the evaluation aspect (e.g., "문단 구조", "어휘 다양성"); **do not copy metric IDs** like "intra_paragraph_structure" into `rubric`.

# 14) **Quality boosters (make feedback feel premium)**:
#    - For each issue, include a short **expected_effect** describing the **reader impact** in Korean (예: "사건의 흐름이 이어져 읽는 동안 멈칫하는 구간이 줄어듭니다.").
#    - Avoid repeating identical advice across issues; each issue should apply a **distinct lever** (예: 구조/접속/어휘 선택/문장 성분 질서).
#    - Prefer **topic-first** revisions for structure issues (주제문 선행 → 근거 → 예시 → 마무리).
#    - When suggesting transitions, choose from a small curated set for clarity: **그러나/따라서/한편/이때/결국/특히**.

# [Rendering policy (FYI)]
# - Metric names/values are not shown as labels in UI; fill numbers in JSON as needed.
# - Each issue should flow as: (1) phenomenon, (2) table [before → after], (3) root cause & improvement suggestion.

# [Template]
# {json_template}
# """






# JSON_TEMPLATE_OBJ = {
#   "summary": "",
#   "issues": [
#     {
#       "rubric": "",
#       "type": "lexicon|morphology|syntax|cohesion|discourse|readability",
#       "phenomenon": "",
#       "metric_link": "",
#       "metric_current": 0.0,
#       "metric_target": 0.0,
#       "evidence": { "sent_idx": 0, "span": "", "level": "sentence", "para_idx": 0 },
#       "why": "",
#       "suggestion": "",
#       "expected_effect": "",
#       "edit": {
#         "before": "",
#         "after": "",
#         "edit_ops": ["치환"]
#       }
#     }
#   ],
#   "action_plan": [],
#   "sample_edits": [],
#   "reasoning_brief": [],
#   "one_liner": ""
# }

# def create_generator_prompt(original_text: str,
#                             target_rubrics: List[str],
#                             elite_gaps: List[Dict[str, Any]]) -> str:
#     # JSON 직렬화로 안전 삽입(가이드/타깃 포함), original_text도 직렬화하여 중괄호 충돌 방지
#     return TEMPLATE_JSON_ONLY.format(
#         target_rubrics=json.dumps(target_rubrics, ensure_ascii=False),
#         elite_gaps=json.dumps(elite_gaps, ensure_ascii=False),
#         original_text=json.dumps(original_text, ensure_ascii=False),
#         json_template=json.dumps(JSON_TEMPLATE_OBJ, ensure_ascii=False, indent=2)
#     )

# # ------------------------------------------------------------
# # Verifier(렌더 텍스트 생성)
# # ------------------------------------------------------------
# def create_verifier_prompt(original_text: str, draft_json_str: str) -> str:
#     try:
#         data = json.loads(draft_json_str) if draft_json_str else {}
#     except Exception:
#         data = {}

#     summary = data.get("summary") or ""
#     issues: List[Dict[str, Any]] = data.get("issues") or []
#     action_plan: List[str] = data.get("action_plan") or []
#     sample_edits: List[Dict[str, Any]] = data.get("sample_edits") or []
#     reasoning_brief: List[str] = data.get("reasoning_brief") or []
#     one_liner = data.get("one_liner") or ""

#     # sample_edits를 metric_link 기준으로 빠르게 참조할 수 있게 맵 구성(백업용)
#     edit_map: Dict[str, Dict[str, Any]] = {}
#     for s in sample_edits:
#         ml = s.get("metric_link")
#         if ml and ml not in edit_map:
#             edit_map[ml] = s

#     lines: List[str] = []

#     # 1) 종합 진단
#     lines.append("## 종합 진단")
#     lines.append(summary.strip() or "좋은 시도를 많이 했어요. 몇 가지만 보완하면 훨씬 더 설득력 있는 글이 됩니다.")
#     lines.append("\n---")

#     # 2) 핵심 수정 포인트
#     lines.append("\n## 핵심 수정 포인트")
#     if issues:
#         for it in issues:
#             phenomenon = it.get("phenomenon", "N/A")
#             why = it.get("why", "내용 없음.")
#             suggestion = it.get("suggestion", "내용 없음.")
#             issue_type = it.get("type", "N/A")
#             rubric = it.get("rubric", "N/A")
#             metric_link = it.get("metric_link")

#             ev = it.get("evidence", {}) or {}
#             span = ev.get("span", "")

#             # 표 데이터 우선순위: issue.edit > sample_edits(같은 metric_link) > evidence.span
#             edit = it.get("edit") or {}
#             before = edit.get("before") or (edit_map.get(metric_link, {}).get("before") if metric_link else None) or (span or "")
#             after  = edit.get("after")  or (edit_map.get(metric_link, {}).get("after")  if metric_link else None) or ""

#             # 카드 헤더 (지표/수치 비노출)
#             lines.append(f"\n### 현상: {phenomenon}")
#             lines.append(f"* **관련 평가항목**: `{rubric}` (유형: `{issue_type}`)")

#             # 표: 기존 → 수정
#             lines.append("\n|  | 문장 |")
#             lines.append("|:---:|:---:|")
#             lines.append(f"| 기존 | {before} |")
#             lines.append(f"| 수정 | {after} |")

#             # 문제 원인 / 개선 제안
#             lines.append("\n> **문제 원인**")
#             lines.append(f"> {why}")
#             lines.append("\n> **개선 제안**")
#             lines.append(f"> {suggestion}")

#             lines.append("\n---")
#     else:
#         lines.append("- (핵심 수정 포인트 없음)")
#         lines.append("\n---")

#     # 3) 한 줄 요약(명령형)
#     lines.append("\n## 한 줄 요약")
#     lines.append(one_liner or "핵심어 반복을 줄이고 문단 연결어를 정돈해보자.")

#     return "\n".join(lines)
