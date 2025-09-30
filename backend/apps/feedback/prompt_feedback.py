# backend/apps/feedback/prompt_feedback.py
from __future__ import annotations
import json
from textwrap import dedent
from typing import Dict, List, Optional, Any

# ------------------------------------------------------------
#  피드백 설계 철학 (요약)
#  - Summary: 2~3문장, 지표 연결된 강점/개선 핵심만.
#  - Issues: 국어학 축(lexicon/morphology/syntax/cohesion/discourse/readability),
#            각 항목에 현상명·국어학 근거·지표연결(metric_link)·효과·전→후 수정안.
#  - Evidence/Plan 숫자표는 미노출. hidden_data는 출력 금지.
# ------------------------------------------------------------

# =========================
#  Generator Prompt
# =========================
def create_generator_prompt(
    original_text: str,
    feat29: Optional[Dict[str, float]] = None,
    rubric_scores: Optional[Dict[str, float]] = None,
    top_k_features: Optional[List[str]] = None,
    target_rubrics: Optional[List[str]] = None,
    elite_gaps_table: Optional[List[Dict[str, Any]]] = None,
) -> str:
    feat_json   = json.dumps(feat29 or {}, ensure_ascii=False, indent=2)
    rubric_json = json.dumps(rubric_scores or {}, ensure_ascii=False, indent=2)
    topk_json   = json.dumps(top_k_features or [], ensure_ascii=False, indent=2)
    target_json = json.dumps(target_rubrics or [], ensure_ascii=False, indent=2)
    gaps_json   = json.dumps(elite_gaps_table or [], ensure_ascii=False, indent=2)

    return dedent(f"""
    너는 **국어학 기반 한국어 글쓰기 컨설턴트**다. 아래 **JSON 템플릿의 빈 값만** 채워서 **JSON만** 반환한다.
    (서문/마크다운/코드블록/자유문 금지)

    [hidden_data]
    target_rubrics: {target_json}
    elite_gaps: {gaps_json}
    // 각 row: feature, label_ko, desc_ko_llm, value, elite_center, z_like, status, suggest, strength

    [절대 규칙]
    1) 출력은 아래 섹션들만 포함한다: summary / issues[] / action_plan[] / sample_edits[] / reasoning_brief[] / one_liner
    2) **metric_link는 hidden_data.elite_gaps[].feature 중에서만 선택**한다. **grade_* 지표 사용 금지.**
    3) 각 이슈는 반드시 **target_rubrics** 중 하나에 귀속한다(두 루브릭 이외 금지).
    4) 지표 의미 설명은 **label_ko / desc_ko_llm**을 참고하되, 수치/표는 노출하지 않는다.
    5) 수정안은 규칙 기반 **전→후** 한 줄로, 과도한 재창작 금지. 모호어(어색/자연스럽게 등) 금지.

    [원문]
    {original_text}

    [참고 블록(출력에 노출 금지)]
    features: {feat_json}
    rubric: {rubric_json}
    top_k_features: {topk_json}

    [템플릿]
    {{
      "summary": "",   // 2~3문장: 강점 1~2 + 개선 1~2 (지표 연결)
      "issues": [
        {{
          "rubric": "",                // target_rubrics 중 하나 (영문 키)
          "type": "lexicon|morphology|syntax|cohesion|discourse|readability",
          "phenomenon": "",
          "metric_link": "",           // ← hidden_data.elite_gaps.feature 중에서만
          "why": "",                   // 독해/논증/톤 영향
          "suggestion": ""             // 전: …  후: …
        }}
      ],
      "action_plan": [],               // 2~4개: 규칙·행동 중심
      "sample_edits": [],              // 전→후 예시 1~3개
      "reasoning_brief": [],           // 2~4줄: 지표-루브릭 연결 근거 요약
      "one_liner": ""                  // 한 줄 요약
    }}
    """).strip()


# =========================
#  Verifier Prompt
# =========================
def create_verifier_prompt(original_text: str, draft_json: str) -> str:
    """
    초안(JSON 문자열)을 검토해 **최종 Markdown**만 출력한다.
    - features/rubric/top_k_features 등은 최종 출력에 포함하지 않는다.
    - 섹션 6개(순서 고정):
      ## 타깃 루브릭 요약
      ## 핵심 이슈
      ## 수정 지침 (액션 플랜)
      ## 샘플 문장 수정
      ## 간결 근거 (Reasoning – brief)
      ## 한 줄 요약
    - metric_link는 draft의 값을 유지하되, 포맷/간결성만 정돈한다.
    """
    obj = _safe_json(draft_json)
    issues = obj.get("issues", [])
    summary = obj.get("summary", "")
    action_plan = obj.get("action_plan", [])
    sample_edits = obj.get("sample_edits", [])
    reasoning_brief = obj.get("reasoning_brief", [])
    one_liner = obj.get("one_liner", "")

    # 타깃 루브릭 추출(issues에서 수집)
    target_rubrics = []
    for it in issues:
        r = it.get("rubric")
        if r and r not in target_rubrics:
            target_rubrics.append(r)

    # Markdown 조립
    lines = []
    lines.append("## 타깃 루브릭 요약")
    if summary:
        lines.append(summary.strip())

    lines.append("\n## 핵심 이슈")
    for it in issues:
        rubric = it.get("rubric", "")
        tp = it.get("type", "")
        ph = it.get("phenomenon", "")
        ml = it.get("metric_link", "")
        why = it.get("why", "")
        sug = it.get("suggestion", "")
        lines.append(f"- **rubric**: {rubric} / **type**: {tp} / **phenomenon**: {ph} / **metric_link**: {ml} / **why**: {why} / **suggestion**: {sug}")

    lines.append("\n## 수정 지침 (액션 플랜)")
    for i, step in enumerate(action_plan, 1):
        lines.append(f"{i}) {step}")

    lines.append("\n## 샘플 문장 수정")
    for s in sample_edits:
        lines.append(f"- {s}")

    lines.append("\n## 간결 근거 (Reasoning – brief)")
    for s in reasoning_brief:
        lines.append(f"- {s}")

    lines.append("\n## 한 줄 요약")
    lines.append(one_liner.strip())

    return "\n".join(lines).strip()


# =========================
#  JSON 복구 유틸
# =========================
def _safe_json(obj_or_str: str) -> dict:
    s = (obj_or_str or "").strip()
    if not s:
        return {}
    if s.startswith("```"):
        # 코드블록 탈피
        s = s.strip("`")
        nl = s.find("\n")
        if nl != -1:
            s = s[nl + 1 :].strip()
    l = s.find("{")
    r = s.rfind("}")
    if l != -1 and r != -1 and r > l:
        s = s[l : r + 1]
    try:
        return json.loads(s)
    except Exception:
        # 간이 복구 실패 시 빈 객체
        return {}
