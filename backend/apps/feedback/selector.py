# selector.py
from __future__ import annotations
from pathlib import Path
from typing import Dict, List, Any
import json, re

BASE = Path(__file__).resolve().parent
ELITE_JSON = BASE / "top_user_dist" / "unified_feature_stats_v1.json"

RUBRIC_KEYS = [
    "topic_clarity", "narrative", "originality",
    "intra_paragraph_structure", "inter_paragraph_structure",
    "grammar", "vocabulary", "sentence_expression",
]

TOPK_BONUS = 0.25
ACTION_BONUS = 0.20
RESERVE_FROM_TOPK = 2
GRADE_RE = re.compile(r"^grade_", re.I)

def _load_elite() -> dict:
    with open(ELITE_JSON, "r", encoding="utf-8") as f:
        return json.load(f)

_ELITE = _load_elite()
_FEATS_META: Dict[str, Any] = _ELITE.get("features", {}) or {}

def _get(d: dict, *keys, default=None):
    cur = d
    for k in keys:
        if not isinstance(cur, dict): return default
        cur = cur.get(k)
        if cur is None: return default
    return cur

def select_two_lowest_rubrics(rubric_scores: Dict[str, float]) -> List[str]:
    rows = []
    for k in RUBRIC_KEYS:
        if k in rubric_scores:
            rows.append((k, float(rubric_scores[k])))
    rows.sort(key=lambda x: (x[1], x[0]))
    return [r for r, _ in rows[:2]]

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
        vals = []
        for t in tms:
            if isinstance(t, (int, float)):
                vals.append(float(t))
            elif isinstance(t, dict):
                for k in ("value","median","m","p50"):
                    if k in t and isinstance(t[k], (int, float)):
                        vals.append(float(t[k])); break
        if vals:
            vals.sort()
            med = vals[len(vals)//2]
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
    if deciles and all(isinstance(deciles.get(k), (int, float)) for k in ("p30","p70")):
        p30, p70 = float(deciles["p30"]), float(deciles["p70"])
        if x < p30: status, suggest = "부족", "↑ 늘리기"
        elif x > p70: status, suggest = "과다", "↓ 줄이기"
    return status, suggest

def _candidate_features(feat29: dict) -> list[str]:
    return [k for k in feat29.keys() if (k in _FEATS_META and not GRADE_RE.match(k))]

def compare_with_topk_hint(
    feat29: Dict[str, float], client_topk: List[str] | None, top_k: int = 6,
    z_soft: float = 0.5, z_strong: float = 1.0
) -> List[Dict[str, Any]]:
    subset = _candidate_features(feat29)
    hint_set = set(client_topk or [])
    rows: List[Dict[str, Any]] = []
    for feat in subset:
        x = float(feat29.get(feat, 0.0))
        meta = _FEATS_META.get(feat)
        if not meta: continue
        c, s = _center_spread(meta)
        z = _z_like(x, c, s)
        direction = _direction(meta)
        dec = _get(meta, "dist_elite", "deciles", default={}) or {}
        status, suggest = _classify(direction, x, c, dec)

        score = abs(z)
        if feat in hint_set: score += TOPK_BONUS
        if status != "적정": score += ACTION_BONUS

        strength = "참고"
        if abs(z) >= z_soft:   strength = "약권고"
        if abs(z) >= z_strong: strength = "강권고"

        label_ko = meta.get("label_ko") or _get(meta, "dist_elite", "label", default=feat) or feat
        desc_ko  = meta.get("desc_ko_llm")

        rows.append({
            "feature": feat,
            "label_ko": label_ko,
            "desc_ko_llm": desc_ko,
            "value": x,
            "elite_center": c,
            "z_like": z,
            "direction": direction,
            "status": status,
            "suggest": suggest,
            "strength": strength,
            "score": score,
            "is_hint": feat in hint_set,
        })

    rows.sort(key=lambda r: r["score"], reverse=True)
    actionable = [r for r in rows if r["status"] != "적정"]
    picked = actionable[:top_k] if actionable else rows[:top_k]

    if RESERVE_FROM_TOPK > 0 and hint_set:
        already = {r["feature"] for r in picked}
        hint_ranked = [r for r in rows if r["is_hint"]]
        reserve = []
        for r in hint_ranked:
            if len(reserve) >= RESERVE_FROM_TOPK: break
            if r["feature"] not in already:
                reserve.append(r)
        if reserve:
            pool = picked + reserve
            seen, merged = set(), []
            for r in pool:
                if r["feature"] in seen: continue
                seen.add(r["feature"]); merged.append(r)
            merged.sort(key=lambda r: r["score"], reverse=True)
            picked = merged[:top_k]

    return picked

def prepare_feedback_inputs(
    feat29: Dict[str, float],
    rubric_scores: Dict[str, float],
    client_topk: List[str] | None = None,
    top_k:int = 6,
) -> tuple[List[str], List[Dict[str, Any]]]:
    target_rubrics = select_two_lowest_rubrics(rubric_scores)
    elite_gaps = compare_with_topk_hint(feat29, client_topk, top_k=top_k)
    return target_rubrics, elite_gaps
