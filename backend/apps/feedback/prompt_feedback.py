# /home/ukta/KorCAT-web_v2/backend/apps/feedback/prompt_feedback.py

from __future__ import annotations

import json
import re
from typing import Any, Dict, List


# ============================================================
# 1. 공용 유틸리티
# ============================================================
def extract_text(resp: Dict[str, Any]) -> str:
    if not isinstance(resp, dict):
        return ""
    if resp.get("output_text"):
        return resp["output_text"]
    if resp.get("output"):
        for blk in resp["output"]:
            for content in blk.get("content", []):
                if isinstance(content, dict) and "text" in content:
                    return content["text"]
    if resp.get("choices"):
        msg = resp["choices"][0].get("message", {})
        if "content" in msg and isinstance(msg["content"], str):
            return msg["content"]
    if isinstance(resp.get("content"), str):
        return resp["content"]
    return ""


def safe_json(text: str) -> Dict[str, Any]:
    if not text:
        return {}
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.S)
    m = re.search(r"\{.*\}", t, flags=re.S)
    if m:
        t = m.group(0)
    t = re.sub(r"//.*?$", "", t, flags=re.M)
    try:
        return json.loads(t)
    except Exception:
        return {}


def ensure_json_string(obj_or_str: Any) -> str:
    if isinstance(obj_or_str, dict):
        return json.dumps(obj_or_str, ensure_ascii=False)
    if isinstance(obj_or_str, str):
        js = safe_json(obj_or_str)
        if js:
            return json.dumps(js, ensure_ascii=False)
        return "{}"
    return "{}"


# ============================================================
# 2. 루브릭/가이드 포맷터
# ============================================================
RUBRIC_LABELS = {
    "topic_clarity": "주장",
    "narrative": "이유와 근거",
    "originality": "다른 입장 고려",
    "intra_paragraph_structure": "문단 내 조직",
    "inter_paragraph_structure": "글 전체 조직",
    "grammar": "규범",
    "vocab_sentence": "어휘와 문장",
    "Topic_relevance": "주제 적합성",
}


def _rubric_label(key: str) -> str:
    return RUBRIC_LABELS.get(str(key or "").strip(), str(key or "").strip())


def _normalize_advice_block(block: Any) -> tuple[str, List[str]]:
    if isinstance(block, dict):
        diagnosis = str(block.get("diagnosis") or "특이 사항 감지").strip()
        actions = block.get("actions") or []
        if not isinstance(actions, list):
            actions = [str(actions)] if actions else []
        actions = [str(x).strip() for x in actions if str(x).strip()]
        return diagnosis, actions

    if isinstance(block, list):
        actions = [str(x).strip() for x in block if str(x).strip()]
        return "특이 사항 감지", actions

    if isinstance(block, str):
        text = block.strip()
        if not text:
            return "특이 사항 감지", []
        return "특이 사항 감지", [text]

    return "특이 사항 감지", []


def format_target_rubrics(target_rubrics: List[str]) -> str:
    labels = [_rubric_label(key) for key in target_rubrics if str(key).strip()]
    if not labels:
        return "- 우선 루브릭 정보 없음"
    return "\n".join(f"- {label}" for label in labels)


def format_elite_gaps_to_text(elite_gaps: List[Dict[str, Any]]) -> str:
    lines: List[str] = []

    for idx, item in enumerate(elite_gaps, 1):
        feat_name = str(item.get("feature") or "Unknown").strip()
        label_ko = str(item.get("label_ko") or feat_name).strip()
        rubric_hint = _rubric_label(item.get("rubric_hint") or "")
        strength = str(item.get("strength") or "참고").strip()
        status = str(item.get("status") or "").strip()
        suggest = str(item.get("suggest") or "").strip()
        guide = item.get("guide") or {}
        center = item.get("elite_center", 0)
        value = item.get("value", 0)

        if value < center:
            selected_guide = guide.get("when_low") if isinstance(guide, dict) else None
        else:
            selected_guide = guide.get("when_high") if isinstance(guide, dict) else None

        diagnosis, actions = _normalize_advice_block(selected_guide)
        if not actions and isinstance(guide, dict):
            diagnosis = diagnosis or str(guide.get("description") or "특이 사항 감지").strip()
            fallback_desc = str(guide.get("description") or "").strip()
            if fallback_desc:
                actions = [fallback_desc]

        action_text = "\n".join(f"  - {action}" for action in actions) if actions else "  - 문맥에 맞게 자연스럽게 다듬는 방향으로 안내하세요."

        block = (
            f"[Diagnosis {idx}]\n"
            f"- feature: {feat_name}\n"
            f"- label: {label_ko}\n"
            f"- priority rubric: {rubric_hint or '미지정'}\n"
            f"- strength: {strength}\n"
            f"- status: {status or '미지정'}\n"
            f"- action direction: {suggest or '미지정'}\n"
            f"- diagnosis: {diagnosis or '특이 사항 감지'}\n"
            f"- teacher advice:\n{action_text}"
        )
        lines.append(block)

    if not lines:
        return "- 진단 자질 정보가 부족하므로, 원문 자체를 읽고 구조·표현·근거 제시를 중심으로 피드백하세요."

    return "\n\n".join(lines)


# ============================================================
# 3. 생성 프롬프트
# ============================================================
TEMPLATE_TEACHER = """
You are a professional Korean writing tutor.
Your job is to analyze the student's essay and return ONLY ONE JSON object.
Do not output markdown, code fences, explanations, or any text outside JSON.

[Student Essay]
{original_text}

[Priority Rubrics]
{target_rubrics_text}

[Diagnostic Guide]
{diagnostic_guide}

[Instructions]
1. Write all natural-language feedback in Korean.
2. Prioritize the [Priority Rubrics] first. If they conflict with the essay context, choose the most contextually valid issue.
3. Use the [Diagnostic Guide] as a strong hint, but do not copy it verbatim.
4. You must provide exactly 3 issues when possible.
5. Each issue must focus on a different part of the essay.
6. Be concrete. Every issue must contain a before/after revision using the student's original wording as the base.
7. Preserve the student's register in the revised sentence.
   - If the essay uses plain form, keep plain form.
   - If the essay uses polite form, keep polite form.
8. Do not mention numeric scores or metric values to the student.
9. The rubric field must use a human-readable Korean label such as "주장", "이유와 근거", "다른 입장 고려", "문단 내 조직", "글 전체 조직", "규범", "어휘와 문장".
10. metric_link must copy a feature name from the diagnostic guide when available.
11. Output schema must be exactly this:
{{
  "summary": "",
  "issues": [
    {{
      "rubric": "",
      "phenomenon": "",
      "why": "",
      "suggestion": "",
      "edit": {{
        "before": "",
        "after": ""
      }},
      "metric_link": ""
    }}
  ],
  "one_liner": ""
}}
"""


def create_generator_prompt(
    original_text: str,
    target_rubrics: List[str],
    elite_gaps: List[Dict[str, Any]],
) -> str:
    diagnostic_text = format_elite_gaps_to_text(elite_gaps)
    target_rubrics_text = format_target_rubrics(target_rubrics)

    return TEMPLATE_TEACHER.format(
        original_text=json.dumps(original_text, ensure_ascii=False),
        target_rubrics_text=target_rubrics_text,
        diagnostic_guide=diagnostic_text,
    )


# ============================================================
# 4. 렌더용 마크다운 생성기
# ============================================================
def _md_cell(value: Any) -> str:
    text = str(value or "").replace("\r", "")
    text = text.replace("|", "\\|")
    text = text.replace("\n", "<br/>")
    return text


def create_verifier_prompt(original_text: str, draft_json_str: str) -> str:
    try:
        data = json.loads(draft_json_str) if draft_json_str else {}
    except Exception:
        data = {}

    summary = data.get("summary") or ""
    issues: List[Dict[str, Any]] = data.get("issues") or []
    one_liner = data.get("one_liner") or ""

    lines: List[str] = []

    lines.append("## 종합 코멘트")
    lines.append(
        summary.strip()
        or "글을 쓰느라 고생 많았어요. 핵심은 잘 보이니, 몇 군데만 다듬으면 더 설득력 있게 읽혀요."
    )
    lines.append("\n---")

    lines.append("\n## 집중 첨삭 포인트")
    if issues:
        for item in issues:
            phenomenon = item.get("phenomenon") or "수정 제안"
            why = item.get("why") or ""
            suggestion = item.get("suggestion") or ""
            rubric = item.get("rubric") or "작문 조언"

            edit = item.get("edit") or {}
            before = edit.get("before") or "(원문)"
            after = edit.get("after") or "(수정안)"

            lines.append(f"\n### {phenomenon}")
            lines.append(f"* **관련 영역**: `{rubric}`")
            lines.append("\n| 구분 | 문장 |")
            lines.append("| :---: | :--- |")
            lines.append(f"| 기존 | {_md_cell(before)} |")
            lines.append(f"| 수정 | **{_md_cell(after)}** |")

            if why:
                lines.append("\n**[왜 고쳐야 할까요?]**")
                lines.append(why)

            if suggestion:
                lines.append("\n**[이렇게 해보세요]**")
                lines.append(suggestion)

            lines.append("\n---")
    else:
        lines.append("- 특별히 지적할 내용 없이 훌륭합니다!")
        lines.append("\n---")

    if one_liner:
        lines.append("\n## 한 줄 응원")
        lines.append(one_liner)

    return "\n".join(lines)