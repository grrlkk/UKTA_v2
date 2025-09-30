from __future__ import annotations
import json, re
from typing import Any, Dict, List, Optional, Tuple

def extract_text(resp: Dict[str, Any]) -> str:
    if not isinstance(resp, dict):
        return ""
    if resp.get("output_text"):
        return resp["output_text"]
    if resp.get("output"):
        for blk in resp["output"]:
            for c in blk.get("content", []):
                if isinstance(c, dict) and "text" in c:
                    return c["text"]
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

TEMPLATE_JSON_ONLY = """너는 **국어학 기반 한국어 글쓰기 컨설턴트**다. 오직 JSON만 출력한다(마크다운/서문/코드블록 금지).

[hidden_data]
target_rubrics: {target_rubrics}
elite_gaps: {elite_gaps}
original_text: {original_text}

[절대 규칙]
1) 출력 필드: summary, issues[], action_plan[], sample_edits[], reasoning_brief[], one_liner (필수)
2) issues[].metric_link는 elite_gaps[].feature 중 하나여야 한다(철자 정확히 일치).
3) 각 issue는 반드시 original_text에서 **증거 문장**을 최소 1개 지정한다
   - evidence.sent_idx: 0부터 시작하는 문장 인덱스
   - evidence.span: 해당 문장 내 수정 대상 원문 구절(정확한 서브스트링)
4) 각 issue는 다음을 모두 포함: rubric, type, phenomenon, metric_link, why, suggestion,
   metric_current, metric_target, expected_effect
   - metric_current = elite_gaps.value
   - metric_target: direction이 higher_is_better면 elite_center 이상(필요시 +5~10% 여유),
                    lower_is_better면 elite_center 이하(필요시 -5~10% 여유)
5) sample_edits[]는 최소 2개. 각 항목은 반드시:
   - metric_link를 1개 명시
   - sent_idx, before(원문 그대로), after(수정안), edit_ops[치환/삽입/삭제/분할/결합 등] 포함
6) 금지어: "자연스럽게", "어색함", "좀 더", "등등", "전반적으로" 같은 모호어 사용 금지.
   수정안은 **구체 명사/동사**로 작성하고, 불필요한 재창작 금지(원문의 화법과 정보 보존).
7) issues는 최소 4개. 서로 다른 metric_link를 **최소 3개 이상** 포함.
8) one_liner는 20자 내외의 한국어 명령형 한 줄.
9) 오직 JSON만 출력. 주석/여분 텍스트/코드펜스 금지.

[템플릿]
{json_template}
"""

JSON_TEMPLATE_OBJ = {
  "summary": "",
  "issues": [
    {
      "rubric": "",   # target_rubrics 중 하나
      "type": "lexicon|morphology|syntax|cohesion|discourse|readability",
      "phenomenon": "",
      "metric_link": "",         # elite_gaps.feature
      "metric_current": 0.0,     # elite_gaps.value
      "metric_target": 0.0,      # 규칙 4에 따라 산정
      "evidence": { "sent_idx": 0, "span": "" },
      "why": "",
      "suggestion": "",          # ‘무엇을 어떻게’ (금지어 금지)
      "expected_effect": ""      # 수정이 metric과 rubric에 주는 효과 1문장
    }
  ],
  "action_plan": [
    # 예: "문장 3에서 '초딩'을 '초등학생'으로 치환(lexicon), 동일 문단에서 동의어 1개 추가"
  ],
  "sample_edits": [
    {
      "metric_link": "",
      "sent_idx": 0,
      "before": "",
      "after": "",
      "edit_ops": ["치환","삽입"]  # 편집 연산 명시
    }
  ],
  "reasoning_brief": [],
  "one_liner": ""
}

def create_generator_prompt(original_text: str,
                            target_rubrics: List[str],
                            elite_gaps: List[Dict[str, Any]]) -> str:
    prompt = TEMPLATE_JSON_ONLY.format(
        target_rubrics=target_rubrics,
        elite_gaps=elite_gaps,
        original_text=original_text,
        json_template=json.dumps(JSON_TEMPLATE_OBJ, ensure_ascii=False, indent=2)
    )
    return prompt

def create_verifier_prompt(original_text: str, draft_json_str: str) -> str:
    try:
        data = json.loads(draft_json_str) if draft_json_str else {}
    except Exception:
        data = {}

    summary = data.get("summary") or ""
    issues: List[Dict[str, Any]] = data.get("issues") or []
    action_plan: List[str] = data.get("action_plan") or []
    sample_edits: List[str] = data.get("sample_edits") or []
    reasoning_brief: List[str] = data.get("reasoning_brief") or []
    one_liner = data.get("one_liner") or ""

    lines: List[str] = []

    lines.append("## 📝 요약")
    lines.append(summary or "요약 없음.")
    lines.append("\n---")

    lines.append("\n## 🔍 핵심 이슈")
    if issues:
        for it in issues:
            mc = it.get("metric_current", 0.0)
            mt = it.get("metric_target", 0.0)
            mc_str = f"{mc:.4f}" if isinstance(mc, float) else str(mc)
            mt_str = f"{mt:.4f}" if isinstance(mt, float) else str(mt)
            
            ev = it.get("evidence", {}) or {}
            sidx = ev.get("sent_idx", "N/A")
            span = ev.get("span", "N/A")
            issue_type = it.get("type", "N/A")

            issue_card = f"""
### 🧐 현상: {it.get('phenomenon', 'N/A')}

* **관련 평가항목**: `{it.get('rubric', 'N/A')}` (유형: `{issue_type}`)
* **관련 지표**: `{it.get('metric_link', 'N/A')}` (`{mc_str}` → `{mt_str}` 목표)
* **문제 지점(Evidence)**: 문장 #{sidx}, "{span}"

> **문제 원인**
> {it.get('why', '내용 없음.')}
>
> **개선 제안 💡**
> {it.get('suggestion', '내용 없음.')}
>
> **기대 효과 🎯**
> {it.get('expected_effect', '내용 없음.')}
"""
            lines.append(issue_card)
            lines.append("\n---")
    else:
        lines.append("- (이슈 없음)")

    lines.append("\n## 📋 수정 지침 (액션 플랜)")
    if action_plan:
        for i, s in enumerate(action_plan, 1):
            lines.append(f"{i}. {s}")
    else:
        lines.append("- (없음)")
    lines.append("\n---")

    lines.append("\n## ✍️ 샘플 문장 수정")
    if sample_edits:
        for s in sample_edits:
            ops = ", ".join(s.get("edit_ops", []) or [])
            sample_card = f"""
**[관련 지표: `{s.get('metric_link', 'N/A')}`]** (문장 #{s.get('sent_idx', 'N/A')} | 수정 방식: {ops})
> **Before:** {s.get('before', '')}
>
> **After:** {s.get('after', '')}
"""
            lines.append(sample_card)
    else:
        lines.append("- (없음)")
    lines.append("\n---")
    
    lines.append("\n## 🧠 간결 근거 (Reasoning – brief)")
    if reasoning_brief:
        for s in reasoning_brief:
            lines.append(f"- {s}")
    else:
        lines.append("- (없음)")
    lines.append("\n---")

    lines.append("\n## 💬 한 줄 요약")
    lines.append(one_liner or "(없음)")

    return "\n".join(lines)