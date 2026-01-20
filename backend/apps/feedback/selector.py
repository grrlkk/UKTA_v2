
# /home/ukta/KorCAT-web_v2/backend/apps/feedback/selector.py

from __future__ import annotations
from pathlib import Path
from typing import Dict, List, Any, Tuple
import json, re

# -----------------------------
# 경로 설정
# -----------------------------
_THIS_FILE = Path(__file__).resolve()
BASE = _THIS_FILE.parent
DATA_DIR = BASE / "top_user_dist"

ELITE_JSON = DATA_DIR / "unified_feature_stats_v1.json"
GUIDE_JSON = DATA_DIR / "feature_guide.json"

# -----------------------------
# 상수/정규식
# -----------------------------
RUBRIC_KEYS = [
    "topic_clarity", "narrative", "originality",
    "intra_paragraph_structure", "inter_paragraph_structure",
    "grammar", "vocabulary", "sentence_expression",
]

TOPK_BONUS = 0.20
ACTION_BONUS = 0.20
RESERVE_FROM_TOPK = 2
GRADE_RE = re.compile(r"^grade_", re.I)

# -----------------------------
# 안전 로더들
# -----------------------------
def _safe_load_json(path: Path, default: Any) -> Any:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

# 엘리트 분포 메타
_ELITE: Dict[str, Any] = _safe_load_json(ELITE_JSON, default={})
_FEATS_META: Dict[str, Any] = _ELITE.get("features", {}) or {}

# 가이드(29개 + __default__)
_GUIDES: Dict[str, Any] = _safe_load_json(
    GUIDE_JSON,
    default={
        "__default__": {
            "title": "일반 가이드",
            "description": "선정된 자질의 대표 현상과 개선법을 간결하게 설명하고, 원문 핵심 문장을 한 줄로 골라 수정 제안 한 문장을 제시하세요.",
            "when_low": "엘리트 대비 낮으면 해당 자질을 늘리기 위한 구체 기법을 1~2개 제안.",
            "when_high": "엘리트 대비 높으면 과잉을 줄이는 편집(중복/군더더기 축소, 단순화) 제안.",
            "examples": []
        }
    }
)

__all__ = [
    "GUIDE_JSON",
    "ELITE_JSON",
    "prepare_feedback_inputs",
    "select_two_lowest_rubrics",
    "compare_with_topk_hint",
    "compare_with_topk_hint_grouped",
]

# -----------------------------
# 헬퍼
# -----------------------------
def _get(d: dict, *keys, default=None):
    cur = d
    for k in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(k)
        if cur is None:
            return default
    return cur

def select_two_lowest_rubrics(rubric_scores: Dict[str, float]) -> List[str]:
    rows: List[Tuple[str, float]] = []
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
        vals: List[float] = []
        for t in tms:
            if isinstance(t, (int, float)):
                vals.append(float(t))
            elif isinstance(t, dict):
                for k in ("value", "median", "m", "p50"):
                    if k in t and isinstance(t[k], (int, float)):
                        vals.append(float(t[k]))
                        break
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
    if deciles and all(isinstance(deciles.get(k), (int, float)) for k in ("p30", "p70")):
        p30, p70 = float(deciles["p30"]), float(deciles["p70"])
        if x < p30: status, suggest = "부족", "↑ 늘리기"
        elif x > p70: status, suggest = "과다", "↓ 줄이기"
    return status, suggest

def _candidate_features(feat29: dict) -> list[str]:
    return [k for k in feat29.keys() if (k in _FEATS_META and not GRADE_RE.match(k))]

def _feat_rubric_hint(feat: str) -> str:
    """feature_guide.json의 rubric_hint를 안전 반환"""
    g = _GUIDES.get(feat, {}) or {}
    rh = g.get("rubric_hint") or ""
    return str(rh).strip()

def _norm_rubric(name: str) -> str:
    return (name or "").strip()

# -----------------------------
# 기존: 루브릭 무시하고 전역 랭킹
# -----------------------------
def compare_with_topk_hint(
    feat29: Dict[str, float],
    client_topk: List[str] | None,
    top_k: int = 6,
    z_soft: float = 0.5,
    z_strong: float = 1.0
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
        if abs(z) >= z_soft:   strength = "약권고"
        if abs(z) >= z_strong: strength = "강권고"

        label_ko = meta.get("label_ko") or _get(meta, "dist_elite", "label", default=feat) or feat
        desc_ko  = meta.get("desc_ko_llm")
        guide = _GUIDES.get(feat, _GUIDES.get("__default__", {}))

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
            "guide": guide,
            "rubric_hint": _feat_rubric_hint(feat),
        })

    rows.sort(key=lambda r: r["score"], reverse=True)
    actionable = [r for r in rows if r["status"] != "적정"]
    picked = actionable[:top_k] if actionable else rows[:top_k]

    if RESERVE_FROM_TOPK > 0 and hint_set:
        already = {r["feature"] for r in picked}
        hint_ranked = [r for r in rows if r["is_hint"]]
        reserve = []
        for r in hint_ranked:
            if len(reserve) >= RESERVE_FROM_TOPK:
                break
            if r["feature"] not in already:
                reserve.append(r)
        if reserve:
            pool = picked + reserve
            seen, merged = set(), []
            for r in pool:
                if r["feature"] in seen:
                    continue
                seen.add(r["feature"])
                merged.append(r)
            merged.sort(key=lambda r: r["score"], reverse=True)
            picked = merged[:top_k]

    return picked

# -----------------------------
# 신규: 두 최저 루브릭에 **각 3개씩** 쿼터로 선별
# -----------------------------
def compare_with_topk_hint_grouped(
    feat29: Dict[str, float],
    target_rubrics: List[str] | None,
    client_topk: List[str] | None = None,
    per_quota: int = 3,
    z_soft: float = 0.5,
    z_strong: float = 1.0
) -> List[Dict[str, Any]]:
    """
    1) 전 자질에 대해 z-격차/보너스 계산(기존 동일)
    2) target_rubrics 각 항목에서 rubric_hint 매칭 자질만 모아 score 순으로 per_quota개 선별
    3) 부족분은 (힌트 우선, score 순) 전역에서 백필
    """

    subset = _candidate_features(feat29)
    hint_set = set(client_topk or [])
    rows: List[Dict[str, Any]] = []

    # 1) 점수 산출
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
        if abs(z) >= z_soft:   strength = "약권고"
        if abs(z) >= z_strong: strength = "강권고"

        label_ko = meta.get("label_ko") or _get(meta, "dist_elite", "label", default=feat) or feat
        desc_ko  = meta.get("desc_ko_llm")
        guide = _GUIDES.get(feat, _GUIDES.get("__default__", {}))

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
            "guide": guide,
            "rubric_hint": _feat_rubric_hint(feat),
        })

    # 전역 랭킹(백필용)
    rows.sort(key=lambda r: (r["is_hint"], r["score"]), reverse=True)

    target_rubrics = list(target_rubrics or [])
    target_rubrics = [_norm_rubric(r) for r in target_rubrics if r]

    picked: List[Dict[str, Any]] = []
    picked_set = set()

    # 2) 루브릭별 쿼터 선별
    if target_rubrics:
        for rub in target_rubrics:
            bucket = [r for r in rows
                      if r["feature"] not in picked_set
                      and _norm_rubric(r.get("rubric_hint", "")) == rub]
            bucket.sort(key=lambda r: (r["is_hint"], r["score"]), reverse=True)
            take = bucket[:per_quota]
            for r in take:
                picked.append(r)
                picked_set.add(r["feature"])

    # 3) 부족분 백필(힌트 우선, 점수순)
    need = max(0, (per_quota * max(1, len(target_rubrics))) - len(picked))
    if need > 0:
        leftovers = [r for r in rows if r["feature"] not in picked_set]
        # 힌트 우선 → 점수순
        leftovers.sort(key=lambda r: (r["is_hint"], r["score"]), reverse=True)
        for r in leftovers[:need]:
            picked.append(r)
            picked_set.add(r["feature"])

    return picked

# -----------------------------
# 외부 진입점
# -----------------------------
def prepare_feedback_inputs(
    feat29: Dict[str, float],
    rubric_scores: Dict[str, float],
    client_topk: List[str] | None = None,
    top_k: int = 6,
) -> tuple[List[str], List[Dict[str, Any]]]:
    # 1) 최저 루브릭 2개
    target_rubrics = select_two_lowest_rubrics(rubric_scores)

    # 2) 각 루브릭에서 3개씩 = 6개(부족하면 글로벌 백필)
    per_quota = max(1, top_k // max(1, len(target_rubrics) or 1))
    elite_gaps = compare_with_topk_hint_grouped(
        feat29=feat29,
        target_rubrics=target_rubrics,
        client_topk=client_topk,
        per_quota=per_quota,
    )
    return target_rubrics, elite_gaps
