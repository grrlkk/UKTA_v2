# backend/apps/feedback/prompt_feedback.py
from textwrap import dedent

def create_generator_prompt(original_text: str) -> str:
    return dedent(f"""
    You are a professional Korean writing consultant.

    [Student Original Text]
    {original_text}

    [Task]
    1) Produce strict JSON with:
       "summary": "...",
       "evidence": ["...","..."],
       "issues": [
         {{
           "type": "lexicon|sentence|cohesion|readability",
           "why": "1~2문장",
           "fix": "구체적 수정안 (가능하면 전→후 예시)"
         }}
       ],
       "plan": ["작업1","작업2","작업3"]
    2) Korean only. Evidence는 원문에서 **정확히** 인용.
    Return ONLY the JSON.
    """)

def create_verifier_prompt(original_text: str, draft_json: str) -> str:
    return dedent(f"""
    You are a meticulous writing feedback verifier.

    [Student Original Text]
    {original_text}

    [Draft JSON to Verify]
    {draft_json}

    [Rules]
    1) evidence가 원문에 실제로 존재하는지 검증(공백 제외 동일 허용).
    2) 근거 불일치/과장은 제거·수정.
    3) 각 fix는 전→후를 더 구체화.
    4) 최종 출력은 한국어 Markdown:
       ## 종합 진단
       ## 근거 문장
       ## 문제와 수정안 (표: 유형 | 이유 | 수정(전→후))
       ## 오늘의 실행 계획
    Return ONLY the final Markdown.
    """)
