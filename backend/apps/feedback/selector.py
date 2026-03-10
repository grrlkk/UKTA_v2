# /home/ukta/KorCAT-web_v2/backend/apps/feedback/selector.py

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

_THIS_FILE = Path(__file__).resolve()
BASE = _THIS_FILE.parent
DATA_DIR = BASE / "top_user_dist"

ELITE_JSON = DATA_DIR / "unified_feature_stats_v1.json"
GUIDE_JSON = DATA_DIR / "feature_guide.json"

RUBRIC_KEYS = [
    "topic_clarity",
    "narrative",
    "originality",
    "intra_paragraph_structure",
    "inter_paragraph_structure",
    "grammar",
    "vocab_sentence",
]

RUBRIC_MAX = {
    "topic_clarity": 15.0,
    "narrative": 15.0,
    "originality": 15.0,
    "intra_paragraph_structure": 15.0,
    "inter_paragraph_structure": 15.0,
    "grammar": 9.0,
    "vocab_sentence": 9.0,
}

TOPK_BONUS = 0.20
ACTION_BONUS = 0.20
RESERVE_FROM_TOPK = 2
GRADE_RE = re.compile(r"^grade_", re.I)


_RUBRIC_ALIASES = {
    "topic_clarity": "topic_clarity",
    "topic clarity": "topic_clarity",
    "주장": "topic_clarity",
    "주제 명확성": "topic_clarity",

    "narrative": "narrative",
    "이유와 근거": "narrative",
    "서사": "narrative",
    "서사/전개": "narrative",

    "originality": "originality",
    "다른 입장 고려": "originality",
    "독창성": "originality",

    "intra_paragraph_structure": "intra_paragraph_structure",
    "intra paragraph structure": "intra_paragraph_structure",
    "문단 내 조직": "intra_paragraph_structure",
    "문단 내 구조": "intra_paragraph_structure",

    "inter_paragraph_structure": "inter_paragraph_structure",
    "inter paragraph structure": "inter_paragraph_structure",
    "글 전체 조직": "inter_paragraph_structure",
    "문단 간 조직": "inter_paragraph_structure",
    "문단 간 구조": "inter_paragraph_structure",

    "grammar": "grammar",
    "문법": "grammar",
    "규범": "grammar",

    "vocab_sentence": "vocab_sentence",
    "vocabulary": "vocab_sentence",
    "sentence_expression": "vocab_sentence",
    "vocabulary & sentence": "vocab_sentence",
    "어휘": "vocab_sentence",
    "문장 표현": "vocab_sentence",
    "어휘와 문장": "vocab_sentence",

    "topic_relevance": "Topic_relevance",
    "Topic_relevance": "Topic_relevance",
    "topic relevance": "Topic_relevance",
    "주제 적합성": "Topic_relevance",
}


def _safe_load_json(path: Path, default: Any) -> Any:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


_ELITE: Dict[str, Any] = _safe_load_json(ELITE_JSON, default={})
_FEATS_META: Dict[str, Any] = _ELITE.get("features", {}) or {}

_GUIDES: Dict[str, Any] = _safe_load_json(
    GUIDE_JSON,
    default={
        "__default__": {
            "title": "일반 가이드",
            "description": "선정된 자질의 대표 현상과 개선법을 간결하게 설명하고, 원문 핵심 문장을 한 줄로 골라 수정 제안 한 문장을 제시하세요.",
            "when_low": "엘리트 대비 낮으면 해당 자질을 늘리기 위한 구체 기법을 1~2개 제안.",
            "when_high": "엘리트 대비 높으면 과잉을 줄이는 편집(중복/군더더기 축소, 단순화) 제안.",
            "examples": [],
        }
    },
)

__all__ = [
    "GUIDE_JSON",
    "ELITE_JSON",
    "prepare_feedback_inputs",
    "select_two_lowest_rubrics",
    "compare_with_topk_hint",
    "compare_with_topk_hint_grouped",
]


def _get(d: dict, *keys, default=None):
    cur = d
    for k in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(k)
        if cur is None:
            return default
    return cur


def _safe_float(value: Any, default: float = 0.0) -> float:
    if isinstance(value, bool):
        return float(int(value))
    if isinstance(value, (int, float)):
        if isinstance(value, float) and not math.isfinite(value):
            return default
        return float(value)
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return default
        if s.lower() in {"error", "nan", "none", "null", "n/a", "na", "undefined"}:
            return default
        try:
            num = float(s)
            return num if math.isfinite(num) else default
        except Exception:
            return default
    return default


def _ceil_to_step(value: float, step: float) -> float:
    if value <= 0 or step <= 0:
        return 0.0
    return math.ceil(value / step) * step


def _coerce_display_score(key: str, value: Any) -> float:
    v = max(0.0, _safe_float(value, 0.0))

    if key == "grammar":
        return min(9.0, v * 3.0 if v <= 3.0 else v)

    if key in {
        "topic_clarity",
        "narrative",
        "originality",
        "intra_paragraph_structure",
        "inter_paragraph_structure",
        "structural_consistency",
        "length",
    }:
        return min(15.0, v * 5.0 if v <= 3.0 else v)

    if key in {"vocabulary", "sentence_expression"}:
        return min(6.0, v * 2.0 if v <= 3.0 else v)

    if key == "vocab_sentence":
        return min(9.0, v * 3.0 if v <= 3.0 else v)

    if key == "Topic_relevance":
        return min(3.0, v)

    return v


def _compute_vocab_sentence_score(rubric_scores: Dict[str, Any]) -> float:
    has_vocab = "vocabulary" in rubric_scores
    has_sent = "sentence_expression" in rubric_scores

    if has_vocab or has_sent:
        vocab = _coerce_display_score("vocabulary", rubric_scores.get("vocabulary", 0.0))
        sent = _coerce_display_score("sentence_expression", rubric_scores.get("sentence_expression", 0.0))
        scaled = (vocab + sent) * 0.75
        stepped = _ceil_to_step(scaled, 3.0)
        return float(min(9.0, max(0.0, stepped)))

    return _coerce_display_score("vocab_sentence", rubric_scores.get("vocab_sentence", 0.0))


def _display_rubric_scores(rubric_scores: Dict[str, Any]) -> Dict[str, float]:
    return {
        "topic_clarity": _coerce_display_score("topic_clarity", rubric_scores.get("topic_clarity", 0.0)),
        "narrative": _coerce_display_score("narrative", rubric_scores.get("narrative", 0.0)),
        "originality": _coerce_display_score("originality", rubric_scores.get("originality", 0.0)),
        "intra_paragraph_structure": _coerce_display_score(
            "intra_paragraph_structure",
            rubric_scores.get("intra_paragraph_structure", 0.0),
        ),
        "inter_paragraph_structure": _coerce_display_score(
            "inter_paragraph_structure",
            rubric_scores.get("inter_paragraph_structure", 0.0),
        ),
        "grammar": _coerce_display_score("grammar", rubric_scores.get("grammar", 0.0)),
        "vocab_sentence": _compute_vocab_sentence_score(rubric_scores),
    }


def select_two_lowest_rubrics(rubric_scores: Dict[str, Any]) -> List[str]:
    display_scores = _display_rubric_scores(rubric_scores or {})
    rows: List[Tuple[str, float, float, int]] = []

    for index, key in enumerate(RUBRIC_KEYS):
        score = display_scores.get(key, 0.0)
        max_score = RUBRIC_MAX.get(key, 1.0)
        ratio = score / max_score if max_score > 0 else 0.0
        rows.append((key, ratio, score, index))

    rows.sort(key=lambda x: (x[1], x[2], x[3]))
    return [key for key, _, _, _ in rows[:2]]


def _center_spread(meta: Dict[str, Any]) -> tuple[float, float]:
    dist = _get(meta, "dist_elite", default={}) or {}
    mean, std = dist.get("mean"), dist.get("std")
    if isinstance(mean, (int, float)) and isinstance(std, (int, float)) and std > 0:
        return float(mean), float(std)

    dec = dist.get("deciles") or {}
    p20, p50, p80 = dec.get("p20"), dec.get("p50"), dec.get("p80")
    if all(isinstance(x, (int, float)) for x in [p20, p50, p80]):
        spread = float(p80) - float(p20)
        std_like = spread / 1.349 if spread > 0 else 0.0
        return float(p50), std_like

    tms = _get(meta, "direction_meta", "trend_medians", default=[])
    if isinstance(tms, list) and tms:
        vals: List[float] = []
        for t in tms:
            if isinstance(t, (int, float)):
                vals.append(float(t))
            elif isinstance(t, dict):
                for key in ("value", "median", "m", "p50"):
                    if key in t and isinstance(t[key], (int, float)):
                        vals.append(float(t[key]))
                        break
        if vals:
            vals.sort()
            med = vals[len(vals) // 2]
            return float(med), 0.0

    return 0.0, 0.0


def _z_like(x: float, c: float, s: float) -> float:
    return (x - c) / s if s and s > 0 else 0.0


def _direction(meta: Dict[str, Any]) -> str:
    return _get(meta, "direction_meta", "direction", default="higher_is_better")


def _classify(direction: str, x: float, center: float, deciles: Dict[str, float] | None) -> tuple[str, str]:
    if direction == "higher_is_better":
        return ("부족", "↑ 늘리기") if x < center else ("적정", "유지")
    if direction == "lower_is_better":
        return ("과다", "↓ 줄이기") if x > center else ("적정", "유지")

    status, suggest = "적정", "유지"
    if deciles and all(isinstance(deciles.get(k), (int, float)) for k in ("p30", "p70")):
        p30, p70 = float(deciles["p30"]), float(deciles["p70"])
        if x < p30:
            status, suggest = "부족", "↑ 늘리기"
        elif x > p70:
            status, suggest = "과다", "↓ 줄이기"
    return status, suggest


def _candidate_features(feat29: Dict[str, Any]) -> List[str]:
    return [k for k in feat29.keys() if k in _FEATS_META and not GRADE_RE.match(k)]


def _feat_rubric_hint(feat: str) -> str:
    guide = _GUIDES.get(feat, {}) or {}
    rubric_hint = guide.get("rubric_hint") or ""
    return str(rubric_hint).strip()


def _norm_rubric(name: str) -> str:
    key = (name or "").strip()
    if not key:
        return ""
    return _RUBRIC_ALIASES.get(key, _RUBRIC_ALIASES.get(key.lower(), key))


def compare_with_topk_hint(
    feat29: Dict[str, float],
    client_topk: List[str] | None,
    top_k: int = 6,
    z_soft: float = 0.5,
    z_strong: float = 1.0,
) -> List[Dict[str, Any]]:
    subset = _candidate_features(feat29)
    hint_set = set(client_topk or [])
    rows: List[Dict[str, Any]] = []

    for feat in subset:
        x = float(feat29.get(feat, 0.0))
        meta = _FEATS_META.get(feat)
        if not meta:
            continue

        c, s = _center_spread(meta)
        z = _z_like(x, c, s)
        direction = _direction(meta)
        dec = _get(meta, "dist_elite", "deciles", default={}) or {}
        status, suggest = _classify(direction, x, c, dec)

        score = abs(z)
        if feat in hint_set:
            score += TOPK_BONUS
        if status != "적정":
            score += ACTION_BONUS

        strength = "참고"
        if abs(z) >= z_soft:
            strength = "약권고"
        if abs(z) >= z_strong:
            strength = "강권고"

        label_ko = meta.get("label_ko") or _get(meta, "dist_elite", "label", default=feat) or feat
        desc_ko = meta.get("desc_ko_llm")
        guide = _GUIDES.get(feat, _GUIDES.get("__default__", {}))

        rows.append(
            {
                "feature": feat,
                "label_ko": label_ko,
                "desc_ko_llm": desc_ko,
                "value": x,
                "elite_center": c,
                "metric_target": c,
                "z_like": z,
                "direction": direction,
                "status": status,
                "suggest": suggest,
                "strength": strength,
                "score": score,
                "is_hint": feat in hint_set,
                "guide": guide,
                "rubric_hint": _norm_rubric(_feat_rubric_hint(feat)),
            }
        )

    rows.sort(key=lambda r: r["score"], reverse=True)
    actionable = [r for r in rows if r["status"] != "적정"]
    picked = actionable[:top_k] if actionable else rows[:top_k]

    if RESERVE_FROM_TOPK > 0 and hint_set:
        already = {r["feature"] for r in picked}
        hint_ranked = [r for r in rows if r["is_hint"]]
        reserve: List[Dict[str, Any]] = []
        for row in hint_ranked:
            if len(reserve) >= RESERVE_FROM_TOPK:
                break
            if row["feature"] not in already:
                reserve.append(row)

        if reserve:
            pool = picked + reserve
            seen, merged = set(), []
            for row in pool:
                if row["feature"] in seen:
                    continue
                seen.add(row["feature"])
                merged.append(row)
            merged.sort(key=lambda r: r["score"], reverse=True)
            picked = merged[:top_k]

    return picked


def compare_with_topk_hint_grouped(
    feat29: Dict[str, float],
    target_rubrics: List[str] | None,
    client_topk: List[str] | None = None,
    total_k: int | None = None,
    per_quota: int = 3,
    z_soft: float = 0.5,
    z_strong: float = 1.0,
) -> List[Dict[str, Any]]:
    subset = _candidate_features(feat29)
    hint_set = set(client_topk or [])
    rows: List[Dict[str, Any]] = []

    for feat in subset:
        x = float(feat29.get(feat, 0.0))
        meta = _FEATS_META.get(feat)
        if not meta:
            continue

        c, s = _center_spread(meta)
        z = _z_like(x, c, s)
        direction = _direction(meta)
        dec = _get(meta, "dist_elite", "deciles", default={}) or {}
        status, suggest = _classify(direction, x, c, dec)

        score = abs(z)
        if feat in hint_set:
            score += TOPK_BONUS
        if status != "적정":
            score += ACTION_BONUS

        strength = "참고"
        if abs(z) >= z_soft:
            strength = "약권고"
        if abs(z) >= z_strong:
            strength = "강권고"

        label_ko = meta.get("label_ko") or _get(meta, "dist_elite", "label", default=feat) or feat
        desc_ko = meta.get("desc_ko_llm")
        guide = _GUIDES.get(feat, _GUIDES.get("__default__", {}))

        rows.append(
            {
                "feature": feat,
                "label_ko": label_ko,
                "desc_ko_llm": desc_ko,
                "value": x,
                "elite_center": c,
                "metric_target": c,
                "z_like": z,
                "direction": direction,
                "status": status,
                "suggest": suggest,
                "strength": strength,
                "score": score,
                "is_hint": feat in hint_set,
                "guide": guide,
                "rubric_hint": _norm_rubric(_feat_rubric_hint(feat)),
            }
        )

    rows.sort(key=lambda r: (r["is_hint"], r["score"]), reverse=True)

    normalized_targets = [_norm_rubric(r) for r in list(target_rubrics or []) if _norm_rubric(r)]
    target_total = total_k if isinstance(total_k, int) and total_k > 0 else per_quota * max(1, len(normalized_targets))

    picked: List[Dict[str, Any]] = []
    picked_set = set()

    if normalized_targets:
        for rub in normalized_targets:
            bucket = [
                row
                for row in rows
                if row["feature"] not in picked_set and row.get("rubric_hint") == rub
            ]
            bucket.sort(key=lambda r: (r["is_hint"], r["score"]), reverse=True)
            take = bucket[:per_quota]
            for row in take:
                picked.append(row)
                picked_set.add(row["feature"])

    if len(picked) < target_total:
        leftovers = [row for row in rows if row["feature"] not in picked_set]
        leftovers.sort(key=lambda r: (r["is_hint"], r["score"]), reverse=True)
        for row in leftovers:
            if len(picked) >= target_total:
                break
            picked.append(row)
            picked_set.add(row["feature"])

    return picked[:target_total]


def prepare_feedback_inputs(
    feat29: Dict[str, float],
    rubric_scores: Dict[str, float],
    client_topk: List[str] | None = None,
    top_k: int = 6,
) -> tuple[List[str], List[Dict[str, Any]]]:
    target_rubrics = select_two_lowest_rubrics(rubric_scores)
    per_quota = max(1, top_k // max(1, len(target_rubrics) or 1))
    elite_gaps = compare_with_topk_hint_grouped(
        feat29=feat29,
        target_rubrics=target_rubrics,
        client_topk=client_topk,
        total_k=top_k,
        per_quota=per_quota,
    )
    return target_rubrics, elite_gaps
