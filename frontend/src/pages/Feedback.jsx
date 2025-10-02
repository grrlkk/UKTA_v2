// src/pages/Feedback.jsx 이게 왜 될까 미친 
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { LABELS } from "../labels";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLoadingContext } from "../contexts/LoadingContext";

/* =========================================================
   ▶ 루브릭 가중치/표시 규칙 (요청 코드 기반)
========================================================= */
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
const GROUPS = [
  { keys: ["topic_clarity", "narrative", "originality"] }, // 내용
  { keys: ["intra_paragraph_structure", "inter_paragraph_structure"] }, // 조직
  { keys: ["grammar", "vocabulary", "sentence_expression"] }, // 표현
];
const ORDERED_KEYS = GROUPS.flatMap((g) => g.keys);

const weightOf = (key) =>
  ["grammar", "vocabulary", "sentence_expression"].includes(key) ? 2 : 5;
const adjustScore = (key, v) =>
  ["grammar", "vocabulary", "sentence_expression"].includes(key)
    ? (typeof v === "number" ? v : 0) * 2
    : (typeof v === "number" ? v : 0) * 5;

/* =========================================================
   ▶ 하이라이트 유틸 (완전 교체)
   - AI Markdown에서 '기존' 문장들만 추출
   - 공백/구두점/특수문자 무시 정규화 매칭 (원문 인덱스 맵으로 역산)
   - 실패 시 최후 폴백으로 "문장 #N"
========================================================= */
const SENTENCE_SPLIT_RE = /(?<=[.!?…])\s+|\n+/;

const escHtml = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** 원문 인덱스 ↔ 정규화 문자열 매핑 */
const buildNormalizedIndex = (source) => {
  const norm = [];
  const map = []; // normIdx -> originalIdx
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    // 한글/영문/숫자만 보존 (공백, 구두점, 특수문자 제거)
    if (/[0-9A-Za-z\uAC00-\uD7A3]/.test(ch)) {
      norm.push(ch.toLowerCase());
      map.push(i);
    }
  }
  return { norm: norm.join(""), map };
};
const normalizeText = (s) =>
  (s || "")
    .split("")
    .filter((ch) => /[0-9A-Za-z\uAC00-\uD7A3]/.test(ch))
    .join("")
    .toLowerCase();

/** AI Markdown에서 '기존' 문장만 robust 추출(표/인라인/라벨 줄) */
const extractOriginalPhrases = (md) => {
  if (!md) return [];
  const text = md.replace(/\r/g, "");
  const lines = text.split("\n");
  const out = [];

  // 1) 표 형태: | 기존 | 문장 ... |
  for (const line of lines) {
    if (/^\|\s*-{2,}\s*\|\s*-{2,}\s*\|/.test(line)) continue; // 구분선은 스킵
    const m = line.match(/^\|\s*기존\s*\|\s*([^|\n]+?)\s*\|/);
    if (m && m[1] && m[1].trim().length > 0) {
      out.push(m[1].trim());
    }
  }

  // 2) 인라인: "기존: 문장..." / "기존 문장..."
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const inline = line.match(/^\s*기존\s*[:：]\s*(.+?)\s*$/);
    if (inline && inline[1]) {
      out.push(inline[1].trim());
      continue;
    }

    // "기존"만 있는 줄 → 다음 non-empty 줄을 문장으로
    if (/^\s*기존\s*[:：]?\s*$/.test(line)) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length) {
        const cand = lines[j].trim();
        if (cand) out.push(cand);
        i = j;
      }
    }
  }

  // 중복 제거
  return Array.from(new Set(out));
};

/** 최후 폴백: "문장 #N" 파싱 */
const extractSentenceIndices = (md) => {
  const set = new Set();
  if (!md) return set;
  const re = /문장\s*#\s*(\d+)/g;
  let m;
  while ((m = re.exec(md))) {
    const n = Number(m[1]);
    if (!Number.isNaN(n)) set.add(n);
  }
  return set;
};

/** 정규화 매칭으로 모든 범위 찾기 → 원문 인덱스로 역산 */
const findRangesByNormalizedMatch = (source, phrase) => {
  const ranges = [];
  if (!source || !phrase) return ranges;

  const { norm, map } = buildNormalizedIndex(source);
  const pnorm = normalizeText(phrase);
  if (!pnorm) return ranges;

  let pos = 0;
  while (true) {
    const idx = norm.indexOf(pnorm, pos);
    if (idx === -1) break;
    const startOrig = map[idx];
    const endOrig = map[idx + pnorm.length - 1] + 1; // exclusive
    ranges.push([startOrig, endOrig]);
    pos = idx + pnorm.length;
  }
  return ranges;
};

/** 겹치는 범위 병합 */
const mergeRanges = (ranges) => {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    const last = out[out.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
};

/** 범위 기반 HTML 생성 */
const buildHtmlFromRanges = (source, merged) => {
  let html = "";
  let cursor = 0;
  for (const [s, e] of merged) {
    const before = source.slice(cursor, s);
    html += escHtml(before).replace(/\n/g, "<br/>");
    html += `<mark class="hl">${escHtml(source.slice(s, e))}</mark>`;
    cursor = e;
  }
  html += escHtml(source.slice(cursor)).replace(/\n/g, "<br/>");
  return html;
};

/** 메인: '기존' 문장 정규화 매칭 → 실패하면 번호 기반 폴백 */
const buildHighlightedHtmlSmart = (originalText, aiMarkdown) => {
  const source = (originalText || "").replace(/\r/g, "");
  if (!source) return "";

  const phrases = extractOriginalPhrases(aiMarkdown); // '기존'만
  let all = [];
  for (const p of phrases) {
    const hit = findRangesByNormalizedMatch(source, p);
    all = all.concat(hit);
  }
  if (all.length > 0) {
    return buildHtmlFromRanges(source, mergeRanges(all));
  }

  // 폴백: "문장 #N" → 문장 단위로 표시
  const idxSet = extractSentenceIndices(aiMarkdown);
  if (idxSet.size > 0) {
    const text = source;
    const sentences = text
      .split(SENTENCE_SPLIT_RE)
      .map((s) => s.trim())
      .filter(Boolean);

    let html = "";
    let cursor = 0;
    let idx = 0;

    for (const s of sentences) {
      const pos = text.indexOf(s, cursor);
      if (pos === -1) continue;
      const prefix = text.slice(cursor, pos);
      html += escHtml(prefix).replace(/\n/g, "<br/>");

      idx += 1;
      const body = escHtml(s);
      html += idxSet.has(idx) ? `<mark class="hl">${body}</mark>` : body;

      cursor = pos + s.length;
    }
    html += escHtml(text.slice(cursor)).replace(/\n/g, "<br/>");
    return html;
  }

  // 아무것도 못 찾으면 원문 그대로
  return escHtml(source).replace(/\n/g, "<br/>");
};

/* =========================================================
   ▶ 컴포넌트
========================================================= */
export default function Feedback() {
  const { language } = useLanguage();
  const { isLoading, setIsLoading } = useLoadingContext();
  const T = (k) => LABELS?.[k]?.[language] ?? k;
  const rootRef = useRef(null);
  const location = useLocation();

  const [error, setError] = useState("");
  const [aiMd, setAiMd] = useState("");
  const [payload, setPayload] = useState(null);

  // 하이라이트 오버레이 상태/참조
  const hlRef = useRef(null);
  const [hlHtml, setHlHtml] = useState("");

  // 통계 계산(문자수/문장수/문단수/평균 문장 길이)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const $ = (sel, r = root) => r.querySelector(sel);

    const mainInput = $("#mainText");
    function computeStats() {
      const text = (mainInput?.value || "").replace(/\r/g, "");
      const noSpace = text.replace(/\s/g, "");
      const sentList = text
        .split(SENTENCE_SPLIT_RE)
        .map((s) => s.trim())
        .filter(Boolean);
      const paraList = text.split(/\n{2,}|\n(?=\s*\n)/).filter(Boolean);
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const sents = sentList.length || 1;

      $("#chars").textContent = `${noSpace.length}${T("chars_unit")}`;
      $("#sents").textContent = `${sentList.length}${T("count_unit")}`;
      $("#paras").textContent = `${paraList.length || (text ? 1 : 0)}${T(
        "count_unit"
      )}`;
      $("#avglen").textContent = `${Math.round(words / sents) || 0} ${T(
        "words_unit"
      )}`;
    }
    computeStats();
  }, [language]);

  // payload 로드 + 피드백 생성
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mainInput = root.querySelector("#mainText");
    if (!mainInput) return;

    let p = location.state?.payload;
    if (!p) {
      try {
        const cached = sessionStorage.getItem("feedback_payload");
        if (cached) p = JSON.parse(cached);
      } catch {}
    }
    setPayload(p || null);

    const original = p?.essay_score?.text ?? p?.contents ?? "";
    mainInput.value = original || "";

    // 피드백 도착 전 기본 렌더
    setHlHtml(escHtml(mainInput.value || "").replace(/\n/g, "<br/>"));

    async function runFeedbackGeneration(payloadData) {
      if (!payloadData?.essay_score) {
        setError("채점 데이터가 없어 피드백을 생성할 수 없습니다.");
        return;
      }

      setError("");
      setIsLoading(true);
      setAiMd("");
      try {
        const rs = payloadData.essay_score;

        const requestBody = {
          original_text: rs.text,
          feat29: rs.feat29,
          rubric_scores: {
            grammar: rs.grammar,
            vocabulary: rs.vocabulary,
            sentence_expression: rs.sentence_expression,
            inter_paragraph_structure: rs.inter_paragraph_structure,
            intra_paragraph_structure: rs.intra_paragraph_structure,
            structural_consistency: rs.structural_consistency,
            length: rs.length,
            topic_clarity: rs.topic_clarity,
            originality: rs.originality,
            prompt_comprehension: rs.prompt_comprehension,
            narrative: rs.narrative,
          },
          top_k_features: rs.top_k_features || [],
        };

        const base = process.env.REACT_APP_API_URI || "";
        const res = await fetch(`${base}/feedback/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAiMd(data.final_markdown || "");
      } catch (e) {
        setError(String(e?.message || e));
      } finally {
        setIsLoading(false);
      }
    }

    if (p) runFeedbackGeneration(p);
  }, [location.state, setIsLoading]);

  // AI 피드백/원문 변경 시 → '기존' 문자열 기반 하이라이트
  useEffect(() => {
    const root = rootRef.current;
    const mainInput = root?.querySelector("#mainText");
    const text = (mainInput?.value || "").replace(/\r/g, "");
    setHlHtml(buildHighlightedHtmlSmart(text, aiMd));
  }, [aiMd]);

  // Lexical level distribution
  const lexDist = useMemo(() => {
    const rows = ["1", "2", "3", "4", "5"].map((lv) => ({
      key: lv,
      label: T(`level_${lv}`),
      value: 0,
    }));
    const vg = payload?.results?.voc_grades;
    if (!Array.isArray(vg)) return rows;

    let total = 0;
    for (const [gradeRaw, entries] of vg) {
      const grade = String(gradeRaw);
      if (!["1", "2", "3", "4", "5"].includes(grade)) continue;
      if (!Array.isArray(entries)) continue;
      for (const e of entries) {
        const cnt = Number(e?.cnt) || 0;
        rows[Number(grade) - 1].value += cnt;
        total += cnt;
      }
    }
    if (total > 0) {
      for (const r of rows) r.value = Math.round((r.value / total) * 100);
    }
    return rows;
  }, [payload, language]);

  /* ✅ 루브릭: 원점수 그대로 표기/시각화 */
  const rubricRows = useMemo(() => {
    const rs = payload?.essay_score ?? payload?.results?.essay_score ?? null;
    if (!rs) return [];

    const L = (k, fallback) => LABELS?.[k]?.[language] ?? fallback;

    const labelMap = {
      grammar: L("rubric_grammar", "문법"),
      vocabulary: L("rubric_vocabulary", "어휘"),
      sentence_expression: L("rubric_sentence_expression", "문장 표현"),
      intra_paragraph_structure: L(
        "rubric_intra_paragraph_structure",
        "문단 내 구조"
      ),
      inter_paragraph_structure: L(
        "rubric_inter_paragraph_structure",
        "문단 간 구조"
      ),
      topic_clarity: L("rubric_topic_clarity", "주제 명확성"),
      originality: L("rubric_originality", "독창성"),
      narrative: L("rubric_narrative", "서사/전개"),
    };

    return ORDERED_KEYS.map((key) => {
      const raw = typeof rs[key] === "number" ? rs[key] : 0;
      const rawMax = MAX_SCORES[key] || 0;
      const percent =
        rawMax > 0 ? Math.round((raw / rawMax) * 100) : 0;

      return {
        key,
        label: labelMap[key] || key,
        raw,
        rawMax,
        percent,           // ← 바 길이와 동일 기준
        adj: adjustScore(key, raw),
        adjMax: rawMax * weightOf(key),
      };
    });
  }, [payload, language]);

  return (
    <section ref={rootRef} className="fb-wrap">
      <style>{`
        .fb-wrap{max-width:1200px;margin:24px auto;padding:0 16px;color:#e2e8f0}
        .fb-grid{display:grid;grid-template-columns:1.4fr 0.6fr;gap:16px}
        .fb-card{position:relative;background:rgba(15,23,42,.9);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
        .fb-title{font-weight:800;font-size:18px;margin:0 0 12px}
        .fb-sub{color:#94a3b8;font-size:13px}

        .fb-input, .fb-textarea{
          width:100%;
          border:1px solid rgba(255,255,255,.12);
          background:#0b1220;color:#e2e8f0;border-radius:12px;padding:12px;
        }
        .fb-input::placeholder, .fb-textarea::placeholder{color:#94a3b8}
        .fb-textarea{min-height:240px;resize:none;line-height:1.6}

        .fb-readonly{ caret-color:transparent; pointer-events:auto; }
        .fb-readonly:focus{ outline:none }
        .fb-readonly[readonly]{ cursor:default }
        .fb-readonly::-webkit-scrollbar{width:8px;height:8px}
        .fb-readonly::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px}

        .fb-panel{position:sticky;top:16px;height:fit-content}
        .fb-stat-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,0.08);font-size:14px}
        .fb-badge{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12)}
        .fb-ok{color:#10b981;border-color:#10b98133;background:#10b98119}
        .fb-danger{color:#ef4444;border-color:#ef444433;background:#ef444419}
        .fb-section-title{margin:24px 0 8px;font-weight:800}

        .fb-md { line-height:1.7; font-size:14px; color:#e2e8f0 }
        .fb-md h2, .fb-md h3 { margin:16px 0 8px; font-weight:800 }
        .fb-md h2 { font-size:18px }
        .fb-md h3 { font-size:16px }
        .fb-md p { margin:8px 0 }
        .fb-md ul, .fb-md ol { padding-left:20px; margin:8px 0 }
        .fb-md table { width:100%; border-collapse:collapse; margin:8px 0 }
        .fb-md th, .fb-md td { border:1px solid rgba(255,255,255,.12); padding:8px; vertical-align:top }
        .fb-md thead th { background:rgba(255,255,255,.06) }
        .fb-md code { background:rgba(255,255,255,.08); padding:2px 4px; border-radius:4px }

        .lex{margin-top:8px}
        .lex-row{display:flex;align-items:center;gap:8px;margin:6px 0}
        .lex-name{width:52px;color:#94a3b8;font-size:12px}
        .lex-bar{flex:1;height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
        .lex-fill{height:100%;background:linear-gradient(90deg,#60a5fa,#16a34a)}
        .lex-val{width:44px;text-align:right;font-size:12px;color:#cbd5e1}

        .fb-loading-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.6);border-radius:16px;backdrop-filter:blur(2px);z-index:5}
        .fb-loader{display:flex;align-items:center;gap:10px;font-size:14px;color:#cbd5e1}
        .fb-spinner{width:22px;height:22px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:spin 0.9s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

        /* 루브릭 표 */
        .rb-table{width:100%;border-collapse:collapse;margin-top:8px}
        .rb-table th, .rb-table td{border:1px solid rgba(255,255,255,.12);padding:8px;font-size:13px}
        .rb-table thead th{background:rgba(255,255,255,.06)}
        .rb-bar{height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
        .rb-fill{height:100%;display:block}

        /* ===== 하이라이트 오버레이 ===== */
        .fb-textstack{position:relative}
        .fb-textarea.fb-ghost{
          color:transparent; caret-color:transparent;
          background:transparent;
        }
        .fb-text-hl{
          position:absolute; inset:0; padding:12px;
          overflow:auto; pointer-events:none;
          white-space:pre-wrap; line-height:1.6; font-size:14px;
          color:#e2e8f0; z-index:1;
        }
        .fb-text-hl mark.hl{
          background:#fde68a; color:#111827;
          padding:0 2px; border-radius:3px;
        }
      `}</style>

      <div className="fb-grid">
        {/* 상단: 원문 */}
        <div className="fb-card" style={{ gridColumn: "1 / -1" }}>
          <div className="fb-title">
            {LABELS.feedback_main[language]}
            <button
              className="fb-badge"
              onClick={() => {
                const text =
                  rootRef.current?.querySelector("#mainText")?.value || "";
                navigator.clipboard.writeText(text);
              }}
              style={{ marginLeft: 8 }}
            >
              {LABELS.copy[language]}
            </button>
          </div>

          {/* ▼ 하이라이트 오버레이 + textarea 스택 */}
          <div className="fb-textstack">
            {/* 오버레이 (위층) */}
            <div
              id="mainTextHL"
              ref={hlRef}
              className="fb-text-hl"
              dangerouslySetInnerHTML={{ __html: hlHtml }}
              aria-hidden="true"
            />
            {/* 실제 스크롤/복사용 textarea (아래층, 투명 처리) */}
            <textarea
              id="mainText"
              className="fb-textarea fb-readonly fb-ghost"
              placeholder={LABELS.input_origin[language]}
              readOnly
              aria-readonly="true"
              onScroll={(e) => {
                if (hlRef.current) {
                  hlRef.current.scrollTop = e.target.scrollTop;
                  hlRef.current.scrollLeft = e.target.scrollLeft;
                }
              }}
              style={{ userSelect: "text", WebkitUserSelect: "text" }}
            />
          </div>
        </div>

        {/* 가운데: AI 피드백 */}
        <div className="fb-card">
          <div className="fb-title">
            {LABELS.ai_fb[language]}
            {isLoading && (
              <span className="fb-sub"> · {LABELS.fb_gene[language]}</span>
            )}
            {error && (
              <span className="fb-sub" style={{ color: "#ef4444" }}>
                {" "}
                · {error}
              </span>
            )}
            <button
              className="fb-badge"
              onClick={() => navigator.clipboard.writeText(aiMd || "")}
              style={{ marginLeft: 8 }}
              disabled={!aiMd}
              title={LABELS.copy[language]}
            >
              {LABELS.copy[language]}
            </button>
          </div>

          {isLoading && (
            <div className="fb-loading-overlay" role="status" aria-live="polite">
              <div className="fb-loader">
                <div className="fb-spinner" aria-hidden="true" />
                <span>{LABELS.fb_gene[language]}</span>
                <span className="sr-only">Loading</span>
              </div>
            </div>
          )}

          <div className="fb-md" aria-busy={isLoading}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiMd || (isLoading ? "" : LABELS.no_content[language])}
            </ReactMarkdown>
          </div>
        </div>

        {/* 우측 패널: 통계 + (루브릭 → Lexical) */}
        <aside className="fb-panel">
          <div className="fb-card">
            <div className="fb-title">{LABELS.stats_title[language]}</div>
            <div className="fb-stat-row">
              <span>{LABELS.chars[language]}</span> <span id="chars">—</span>
            </div>
            <div className="fb-stat-row">
              <span>{LABELS.sentences[language]}</span>{" "}
              <span id="sents">—</span>
            </div>
            <div className="fb-stat-row">
              <span>{LABELS.paragraphs[language]}</span>{" "}
              <span id="paras">—</span>
            </div>
            <div className="fb-stat-row">
              <span>{LABELS.avg_sentence_len[language]}</span>{" "}
              <span id="avglen">—</span>
            </div>

            {/* ✅ 루브릭: 가중치 반영 + 정렬/자간 수정 */}
            <div className="fb-section-title" style={{ marginTop: 16 }}>
              {LABELS?.essay_score?.[language] ?? "루브릭"}
            </div>

            {Array.isArray(rubricRows) && rubricRows.length > 0 ? (() => {
              const isSixPointKey = (key) =>
                key === "grammar" || key === "vocabulary" || key === "sentence_expression";

              const applyWeight = (r) => {
                let wRaw = r.raw, wMax = r.rawMax;
                if (r.rawMax === 15) { wRaw = Math.min(r.raw * 5, 15); wMax = 15; }
                else if (r.rawMax === 6 || isSixPointKey(r.key)) { wRaw = Math.min(r.raw * 2, 6); wMax = 6; }
                const wPercent = Math.max(0, Math.min(100, (wRaw / wMax) * 100));
                return { ...r, wRaw, wMax, wPercent };
              };

              const rows = rubricRows.map(applyWeight);

              return (
                <table className="rb-table" role="table" aria-label="rubric table" style={{ borderCollapse: "separate" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "30%", textAlign: "center", padding: "6px 8px", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                        {LABELS?.rubric?.[language] ?? "항목"}
                      </th>
                      <th style={{ width: "22%", textAlign: "center", padding: "6px 8px", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                        {LABELS?.score?.[language] ?? "점수"}
                      </th>
                      <th style={{ textAlign: "center", padding: "6px 8px", lineHeight: 1.2 }}>
                        {LABELS?.rubric_visual?.[language] ?? "시각화"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.key}>
                        <td style={{ textAlign: "center", padding: "6px 8px", lineHeight: 1.2, whiteSpace: "nowrap" }} title={r.label}>
                          {r.label}
                        </td>
                        <td
                          style={{
                            textAlign: "center",               // ▶ 점수 열 가운데 정렬
                            padding: "6px 8px",
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            fontVariantNumeric: "tabular-nums"
                          }}
                          title={`raw: ${r.raw} / ${r.rawMax} → weighted: ${r.wRaw} / ${r.wMax}`}
                        >
                          <span className="rb-score">{r.wRaw}/{r.wMax}</span>
                        </td>
                        <td style={{ padding: "6px 8px", lineHeight: 1.2 }}>
                          <div className="rb-bar" aria-label={`${Math.round(r.wPercent)}%`}>
                            <div className="rb-fill" style={{ width: `${r.wPercent}%`, background: "linear-gradient(90deg,#22d3ee,#34d399)", height: 8 }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })() : (
              <div className="fb-sub">{LABELS?.no_rubric?.[language] ?? "루브릭 데이터가 없습니다."}</div>
            )}
            

            {/* Lexical level distribution */}
            <div className="fb-section-title" style={{ marginTop: 16 }}>
              {LABELS.lex_dist_title[language]}
            </div>
            <div className="lex">
              {lexDist.map((row) => (
                <div className="lex-row" key={row.key}>
                  <div className="lex-name">{row.label}</div>
                  <div className="lex-bar">
                    <div
                      className="lex-fill"
                      style={{ width: `${row.value}%` }}
                    ></div>
                  </div>
                  <div className="lex-val">{row.value}%</div>
                </div>
              ))}
            </div>
            <div className="fb-sub">{LABELS.lex_dist_note[language]}</div>
          </div>
        </aside>
      </div>
    </section>
  );
}










// // src/pages/Feedback.jsx 하이라이트 처음 나옴 원문에
// import React, { useEffect, useRef, useState, useMemo } from "react";
// import { useLanguage } from "../contexts/LanguageContext";
// import { LABELS } from "../labels";
// import { useLocation } from "react-router-dom";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import { useLoadingContext } from "../contexts/LoadingContext";

// /* =========================================================
//    ▶ 루브릭 가중치/표시 규칙 (요청 코드 기반)
//    - MAX_SCORES: 각 항목의 원점수 상한
//    - ORDERED_KEYS: 표에 노출할 항목(구조/길이는 제외)
//    - adjustScore: 표시(가중) 점수 변환
//    - weightOf: 막대 %용 가중 최대치 계산에 사용
// ========================================================= */
// const MAX_SCORES = {
//   grammar: 6,
//   vocabulary: 6,
//   sentence_expression: 6,
//   intra_paragraph_structure: 15,
//   inter_paragraph_structure: 15,
//   topic_clarity: 15,
//   originality: 15,
//   narrative: 15,
// };
// // 표/레이더에서 제외되는 항목(요청 코드 기준)
// const EXCLUDED_KEYS = new Set(["structural_consistency", "length"]);
// // 그룹 → 표시 순서 (요청 코드 기준)
// const GROUPS = [
//   { keys: ["topic_clarity", "narrative", "originality"] }, // 내용
//   { keys: ["intra_paragraph_structure", "inter_paragraph_structure"] }, // 조직
//   { keys: ["grammar", "vocabulary", "sentence_expression"] }, // 표현
// ];
// const ORDERED_KEYS = GROUPS.flatMap((g) => g.keys);

// const adjustScore = (key, value) => {
//   const v = typeof value === "number" ? value : 0;
//   switch (key) {
//     case "grammar":
//     case "vocabulary":
//     case "sentence_expression":
//       return v * 2; // 표현: 2배(6→12)
//     case "intra_paragraph_structure":
//     case "inter_paragraph_structure":
//     case "topic_clarity":
//     case "narrative":
//     case "originality":
//       return v * 5; // 내용/조직: 5배(15→75)
//     default:
//       return v;
//   }
// };
// const weightOf = (key) =>
//   ["grammar", "vocabulary", "sentence_expression"].includes(key) ? 2 : 5;

// /* =========================================================
//    ▶ 하이라이트 유틸
//    - extractSentenceIndices: "문장 #3" 패턴에서 번호 추출
//    - buildHighlightedHtml: 원문을 문장 단위로 쪼개고, 대상 문장에 <mark> 적용
// ========================================================= */
// const extractSentenceIndices = (md) => {
//   const set = new Set();
//   if (!md) return set;
//   const re = /문장\s*#(\d+)/g;
//   let m;
//   while ((m = re.exec(md))) {
//     const n = Number(m[1]);
//     if (!Number.isNaN(n)) set.add(n);
//   }
//   return set;
// };

// const buildHighlightedHtml = (text, idxSet) => {
//   if (!text) return "";
//   const source = text.replace(/\r/g, "");

//   // computeStats와 동일한 규칙으로 문장 분리
//   const sentences = source
//     .split(/(?<=[.!?…])\s+|\n+/)
//     .map((s) => s.trim())
//     .filter(Boolean);

//   const esc = (s) =>
//     s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

//   let html = "";
//   let cursor = 0;
//   let idx = 0;

//   for (const s of sentences) {
//     const pos = source.indexOf(s, cursor);
//     if (pos === -1) continue; // 방어 코드

//     // 앞의 공백/개행 보존
//     const prefix = source.slice(cursor, pos);
//     html += esc(prefix).replace(/\n/g, "<br/>");

//     idx += 1;
//     const body = esc(s);
//     html += idxSet.has(idx) ? `<mark class="hl">${body}</mark>` : body;

//     cursor = pos + s.length;
//   }
//   // 꼬리 부분 보존
//   html += esc(source.slice(cursor)).replace(/\n/g, "<br/>");

//   return html;
// };

// export default function Feedback() {
//   const { language } = useLanguage();
//   const { isLoading, setIsLoading } = useLoadingContext();
//   const T = (k) => LABELS?.[k]?.[language] ?? k;
//   const rootRef = useRef(null);
//   const location = useLocation();

//   const [error, setError] = useState("");
//   const [aiMd, setAiMd] = useState("");
//   const [payload, setPayload] = useState(null);

//   // 하이라이트 오버레이 상태/참조
//   const hlRef = useRef(null);
//   const [hlHtml, setHlHtml] = useState("");

//   // 통계 계산(문자수/문장수/문단수/평균 문장 길이)
//   useEffect(() => {
//     const root = rootRef.current;
//     if (!root) return;
//     const $ = (sel, r = root) => r.querySelector(sel);

//     const mainInput = $("#mainText");
//     function computeStats() {
//       const text = (mainInput?.value || "").replace(/\r/g, "");
//       const noSpace = text.replace(/\s/g, "");
//       const sentList = text
//         .split(/(?<=[.!?…])\s+|\n+/)
//         .map((s) => s.trim())
//         .filter(Boolean);
//       const paraList = text.split(/\n{2,}|\n(?=\s*\n)/).filter(Boolean);
//       const words = text.trim() ? text.trim().split(/\s+/).length : 0;
//       const sents = sentList.length || 1;

//       $("#chars").textContent = `${noSpace.length}${T("chars_unit")}`;
//       $("#sents").textContent = `${sentList.length}${T("count_unit")}`;
//       $("#paras").textContent = `${paraList.length || (text ? 1 : 0)}${T(
//         "count_unit"
//       )}`;
//       $("#avglen").textContent = `${Math.round(words / sents) || 0} ${T(
//         "words_unit"
//       )}`;
//       // ✔ 요구사항: "과제 기준(≥1996자)" 제거 → 관련 갱신/표시 로직도 삭제
//     }
//     computeStats();
//   }, [language]);

//   // payload 로드 + 피드백 생성
//   useEffect(() => {
//     const root = rootRef.current;
//     if (!root) return;
//     const mainInput = root.querySelector("#mainText");
//     if (!mainInput) return;

//     let p = location.state?.payload;
//     if (!p) {
//       try {
//         const cached = sessionStorage.getItem("feedback_payload");
//         if (cached) p = JSON.parse(cached);
//       } catch {}
//     }
//     setPayload(p || null);

//     const original = p?.essay_score?.text ?? p?.contents ?? "";
//     mainInput.value = original || "";

//     // 원문이 바뀌었으면 즉시(피드백 도착 전에도) 오버레이 갱신
//     setHlHtml(buildHighlightedHtml(mainInput.value || "", new Set()));

//     async function runFeedbackGeneration(payloadData) {
//       if (!payloadData?.essay_score) {
//         setError("채점 데이터가 없어 피드백을 생성할 수 없습니다.");
//         return;
//       }

//       setError("");
//       setIsLoading(true);
//       setAiMd("");
//       try {
//         const rs = payloadData.essay_score;

//         const requestBody = {
//           original_text: rs.text,
//           feat29: rs.feat29,
//           rubric_scores: {
//             grammar: rs.grammar,
//             vocabulary: rs.vocabulary,
//             sentence_expression: rs.sentence_expression,
//             inter_paragraph_structure: rs.inter_paragraph_structure,
//             intra_paragraph_structure: rs.intra_paragraph_structure,
//             structural_consistency: rs.structural_consistency,
//             length: rs.length,
//             topic_clarity: rs.topic_clarity,
//             originality: rs.originality,
//             prompt_comprehension: rs.prompt_comprehension,
//             narrative: rs.narrative,
//           },
//           top_k_features: rs.top_k_features || [],
//         };

//         const base = process.env.REACT_APP_API_URI || "";
//         const res = await fetch(`${base}/feedback/generate`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(requestBody),
//         });

//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         setAiMd(data.final_markdown || "");
//       } catch (e) {
//         setError(String(e?.message || e));
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     if (p) runFeedbackGeneration(p);
//   }, [location.state, setIsLoading]);

//   // AI 피드백 갱신 시 → "문장 #N"을 추출해 원문 오버레이에 하이라이트 적용
//   useEffect(() => {
//     const root = rootRef.current;
//     const mainInput = root?.querySelector("#mainText");
//     const text = (mainInput?.value || "").replace(/\r/g, "");
//     const idxSet = extractSentenceIndices(aiMd); // 예: {3,5,7}
//     setHlHtml(buildHighlightedHtml(text, idxSet));
//   }, [aiMd]);

//   // Lexical level distribution
//   const lexDist = useMemo(() => {
//     const rows = ["1", "2", "3", "4", "5"].map((lv) => ({
//       key: lv,
//       label: T(`level_${lv}`),
//       value: 0,
//     }));
//     const vg = payload?.results?.voc_grades;
//     if (!Array.isArray(vg)) return rows;

//     let total = 0;
//     for (const [gradeRaw, entries] of vg) {
//       const grade = String(gradeRaw);
//       if (!["1", "2", "3", "4", "5"].includes(grade)) continue;
//       if (!Array.isArray(entries)) continue;
//       for (const e of entries) {
//         const cnt = Number(e?.cnt) || 0;
//         rows[Number(grade) - 1].value += cnt;
//         total += cnt;
//       }
//     }
//     if (total > 0) {
//       for (const r of rows) r.value = Math.round((r.value / total) * 100);
//     }
//     return rows;
//   }, [payload, language]);

//   // 루브릭 표(가중치 적용)
//   const rubricRows = useMemo(() => {
//     const rs = payload?.essay_score ?? payload?.results?.essay_score ?? null;
//     if (!rs) return [];

//     const L = (k, fallback) => LABELS?.[k]?.[language] ?? fallback;

//     const labelMap = {
//       grammar: L("rubric_grammar", "문법"),
//       vocabulary: L("rubric_vocabulary", "어휘"),
//       sentence_expression: L("rubric_sentence_expression", "문장 표현"),
//       intra_paragraph_structure: L(
//         "rubric_intra_paragraph_structure",
//         "문단 내 구조"
//       ),
//       inter_paragraph_structure: L(
//         "rubric_inter_paragraph_structure",
//         "문단 간 구조"
//       ),
//       topic_clarity: L("rubric_topic_clarity", "주제 명확성"),
//       originality: L("rubric_originality", "독창성"),
//       narrative: L("rubric_narrative", "서사/전개"),
//     };

//     // ORDERED_KEYS 기준으로 노출(구조적 일관성, 분량 제외)
//     const rows = ORDERED_KEYS.map((key) => {
//       const raw = typeof rs[key] === "number" ? rs[key] : 0;
//       const adj = adjustScore(key, raw); // 가중 점수
//       const rawMax = MAX_SCORES[key] || 0;
//       const w = weightOf(key);
//       const adjMax = rawMax * w; // 막대 % 기준은 "가중 최대치"
//       const percent =
//         rawMax > 0
//           ? Math.max(0, Math.min(100, Math.round((adj / adjMax) * 100)))
//           : 0;

//       return {
//         key,
//         label: labelMap[key] || key,
//         raw,
//         adj,
//         rawMax,
//         adjMax,
//         percent,
//       };
//     });

//     return rows;
//   }, [payload, language]);

//   return (
//     <section ref={rootRef} className="fb-wrap">
//       <style>{`
//         .fb-wrap{max-width:1200px;margin:24px auto;padding:0 16px;color:#e2e8f0}
//         .fb-grid{display:grid;grid-template-columns:1.4fr 0.6fr;gap:16px}
//         .fb-card{position:relative;background:rgba(15,23,42,.9);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
//         .fb-title{font-weight:800;font-size:18px;margin:0 0 12px}
//         .fb-sub{color:#94a3b8;font-size:13px}

//         .fb-input, .fb-textarea{
//           width:100%;
//           border:1px solid rgba(255,255,255,.12);
//           background:#0b1220;color:#e2e8f0;border-radius:12px;padding:12px;
//         }
//         .fb-input::placeholder, .fb-textarea::placeholder{color:#94a3b8}
//         .fb-textarea{min-height:240px;resize:none;line-height:1.6}

//         .fb-readonly{ caret-color:transparent; pointer-events:auto; }
//         .fb-readonly:focus{ outline:none }
//         .fb-readonly[readonly]{ cursor:default }
//         .fb-readonly::-webkit-scrollbar{width:8px;height:8px}
//         .fb-readonly::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px}

//         .fb-panel{position:sticky;top:16px;height:fit-content}
//         .fb-stat-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,0.08);font-size:14px}
//         .fb-badge{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12)}
//         .fb-ok{color:#10b981;border-color:#10b98133;background:#10b98119}
//         .fb-danger{color:#ef4444;border-color:#ef444433;background:#ef444419}
//         .fb-section-title{margin:24px 0 8px;font-weight:800}

//         .fb-md { line-height:1.7; font-size:14px; color:#e2e8f0 }
//         .fb-md h2, .fb-md h3 { margin:16px 0 8px; font-weight:800 }
//         .fb-md h2 { font-size:18px }
//         .fb-md h3 { font-size:16px }
//         .fb-md p { margin:8px 0 }
//         .fb-md ul, .fb-md ol { padding-left:20px; margin:8px 0 }
//         .fb-md table { width:100%; border-collapse:collapse; margin:8px 0 }
//         .fb-md th, .fb-md td { border:1px solid rgba(255,255,255,.12); padding:8px; vertical-align:top }
//         .fb-md thead th { background:rgba(255,255,255,.06) }
//         .fb-md code { background:rgba(255,255,255,.08); padding:2px 4px; border-radius:4px }

//         .lex{margin-top:8px}
//         .lex-row{display:flex;align-items:center;gap:8px;margin:6px 0}
//         .lex-name{width:52px;color:#94a3b8;font-size:12px}
//         .lex-bar{flex:1;height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
//         .lex-fill{height:100%;background:linear-gradient(90deg,#60a5fa,#16a34a)}
//         .lex-val{width:44px;text-align:right;font-size:12px;color:#cbd5e1}

//         .fb-loading-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.6);border-radius:16px;backdrop-filter:blur(2px);z-index:5}
//         .fb-loader{display:flex;align-items:center;gap:10px;font-size:14px;color:#cbd5e1}
//         .fb-spinner{width:22px;height:22px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:spin 0.9s linear infinite}
//         @keyframes spin{to{transform:rotate(360deg)}}
//         .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

//         /* 루브릭 표 */
//         .rb-table{width:100%;border-collapse:collapse;margin-top:8px}
//         .rb-table th, .rb-table td{border:1px solid rgba(255,255,255,.12);padding:8px;font-size:13px}
//         .rb-table thead th{background:rgba(255,255,255,.06)}
//         .rb-bar{height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
//         .rb-fill{height:100%;background:linear-gradient(90deg,#a78bfa,#34d399)}

//         /* ===== 하이라이트 오버레이 ===== */
//         .fb-textstack{position:relative}
//         .fb-textarea.fb-ghost{
//           color:transparent; caret-color:transparent;
//           background:transparent; /* 카드 배경을 사용 */
//         }
//         .fb-text-hl{
//           position:absolute; inset:0; padding:12px;
//           overflow:auto; pointer-events:none; /* 스크롤은 textarea가 담당 */
//           white-space:pre-wrap; line-height:1.6; font-size:14px;
//           color:#e2e8f0; z-index:1;
//         }
//         .fb-text-hl mark.hl{
//           background:#fde68a; color:#111827;
//           padding:0 2px; border-radius:3px;
//         }
//       `}</style>

//       <div className="fb-grid">
//         {/* 상단: 원문 */}
//         <div className="fb-card" style={{ gridColumn: "1 / -1" }}>
//           <div className="fb-title">
//             {LABELS.feedback_main[language]}
//             <button
//               className="fb-badge"
//               onClick={() => {
//                 const text =
//                   rootRef.current?.querySelector("#mainText")?.value || "";
//                 navigator.clipboard.writeText(text);
//               }}
//               style={{ marginLeft: 8 }}
//             >
//               {LABELS.copy[language]}
//             </button>
//           </div>

//           {/* ▼ 하이라이트 오버레이 + textarea 스택 */}
//           <div className="fb-textstack">
//             {/* 오버레이 (위층) */}
//             <div
//               id="mainTextHL"
//               ref={hlRef}
//               className="fb-text-hl"
//               dangerouslySetInnerHTML={{ __html: hlHtml }}
//               aria-hidden="true"
//             />
//             {/* 실제 스크롤/복사용 textarea (아래층, 투명 처리) */}
//             <textarea
//               id="mainText"
//               className="fb-textarea fb-readonly fb-ghost"
//               placeholder={LABELS.input_origin[language]}
//               readOnly
//               aria-readonly="true"
//               onScroll={(e) => {
//                 if (hlRef.current) {
//                   hlRef.current.scrollTop = e.target.scrollTop;
//                   hlRef.current.scrollLeft = e.target.scrollLeft;
//                 }
//               }}
//               style={{ userSelect: "text", WebkitUserSelect: "text" }}
//             />
//           </div>
//         </div>

//         {/* 가운데: AI 피드백 */}
//         <div className="fb-card">
//           <div className="fb-title">
//             {LABELS.ai_fb[language]}
//             {isLoading && (
//               <span className="fb-sub"> · {LABELS.fb_gene[language]}</span>
//             )}
//             {error && (
//               <span className="fb-sub" style={{ color: "#ef4444" }}>
//                 {" "}
//                 · {error}
//               </span>
//             )}
//             <button
//               className="fb-badge"
//               onClick={() => navigator.clipboard.writeText(aiMd || "")}
//               style={{ marginLeft: 8 }}
//               disabled={!aiMd}
//               title={LABELS.copy[language]}
//             >
//               {LABELS.copy[language]}
//             </button>
//           </div>

//           {isLoading && (
//             <div className="fb-loading-overlay" role="status" aria-live="polite">
//               <div className="fb-loader">
//                 <div className="fb-spinner" aria-hidden="true" />
//                 <span>{LABELS.fb_gene[language]}</span>
//                 <span className="sr-only">Loading</span>
//               </div>
//             </div>
//           )}

//           <div className="fb-md" aria-busy={isLoading}>
//             <ReactMarkdown remarkPlugins={[remarkGfm]}>
//               {aiMd || (isLoading ? "" : LABELS.no_content[language])}
//             </ReactMarkdown>
//           </div>
//         </div>

//         {/* 우측 패널: 통계 + (루브릭 → Lexical) */}
//         <aside className="fb-panel">
//           <div className="fb-card">
//             <div className="fb-title">{LABELS.stats_title[language]}</div>
//             <div className="fb-stat-row">
//               <span>{LABELS.chars[language]}</span> <span id="chars">—</span>
//             </div>
//             <div className="fb-stat-row">
//               <span>{LABELS.sentences[language]}</span>{" "}
//               <span id="sents">—</span>
//             </div>
//             <div className="fb-stat-row">
//               <span>{LABELS.paragraphs[language]}</span>{" "}
//               <span id="paras">—</span>
//             </div>
//             <div className="fb-stat-row">
//               <span>{LABELS.avg_sentence_len[language]}</span>{" "}
//               <span id="avglen">—</span>
//             </div>
//             {/* ✔ 요구사항: '과제 기준(≥1996자)' 행 제거 */}

//             {/* ✅ 1) 루브릭 (가중치 적용) */}
//             <div className="fb-section-title" style={{ marginTop: 16 }}>
//               {LABELS?.rubric_title?.[language] ?? "루브릭"}
//             </div>
//             {rubricRows.length > 0 ? (
//               <table className="rb-table" role="table" aria-label="rubric table">
//                 <thead>
//                   <tr>
//                     <th style={{ width: "45%" }}>
//                       {LABELS?.rubric_item?.[language] ?? "항목"}
//                     </th>
//                     <th style={{ width: "18%" }}>
//                       {LABELS?.rubric_score?.[language] ?? "점수"}
//                     </th>
//                     <th>{LABELS?.rubric_visual?.[language] ?? "시각화"}</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {rubricRows.map((r) => (
//                     <tr key={r.key}>
//                       <td>{r.label}</td>
//                       <td
//                         style={{
//                           textAlign: "right",
//                           fontVariantNumeric: "tabular-nums",
//                         }}
//                         title={`raw: ${r.raw} / ${r.rawMax}`}
//                       >
//                         {/* 표시는 가중 점수 / 원만점(요청 코드 스타일) */}
//                         {r.adj} / {r.rawMax}
//                       </td>
//                       <td>
//                         <div
//                           className="rb-bar"
//                           title={`max(adjusted): ${r.adjMax}`}
//                         >
//                           <div
//                             className="rb-fill"
//                             style={{ width: `${r.percent}%` }}
//                           />
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : (
//               <div className="fb-sub">
//                 {LABELS?.no_rubric?.[language] ?? "루브릭 데이터가 없습니다."}
//               </div>
//             )}

//             {/* ✅ 2) Lexical level distribution (루브릭 아래로 이동) */}
//             <div className="fb-section-title" style={{ marginTop: 16 }}>
//               {LABELS.lex_dist_title[language]}
//             </div>
//             <div className="lex">
//               {lexDist.map((row) => (
//                 <div className="lex-row" key={row.key}>
//                   <div className="lex-name">{row.label}</div>
//                   <div className="lex-bar">
//                     <div
//                       className="lex-fill"
//                       style={{ width: `${row.value}%` }}
//                     ></div>
//                   </div>
//                   <div className="lex-val">{row.value}%</div>
//                 </div>
//               ))}
//             </div>
//             <div className="fb-sub">{LABELS.lex_dist_note[language]}</div>
//           </div>
//         </aside>
//       </div>
//     </section>
//   );
// }
















// // src/pages/Feedback.jsx
// import React, { useEffect, useRef, useState, useMemo } from "react";
// import { useLanguage } from "../contexts/LanguageContext";
// import { LABELS } from "../labels";
// import { useLocation } from "react-router-dom";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import { useLoadingContext } from "../contexts/LoadingContext";

// /* =========================================================
//    ▶ 루브릭 가중치/표시 규칙 (요청 코드 기반)
//    - MAX_SCORES: 각 항목의 원점수 상한
//    - ORDERED_KEYS: 표에 노출할 항목(구조/길이는 제외)
//    - adjustScore: 표시(가중) 점수 변환
//    - weightOf: 막대 %용 가중 최대치 계산에 사용
// ========================================================= */
// const MAX_SCORES = {
//   grammar: 6,
//   vocabulary: 6,
//   sentence_expression: 6,
//   intra_paragraph_structure: 15,
//   inter_paragraph_structure: 15,
//   topic_clarity: 15,
//   originality: 15,
//   narrative: 15,
// };
// // 표/레이더에서 제외되는 항목(요청 코드 기준)
// const EXCLUDED_KEYS = new Set(["structural_consistency", "length"]);
// // 그룹 → 표시 순서 (요청 코드 기준)
// const GROUPS = [
//   { keys: ["topic_clarity", "narrative", "originality"] },           // 내용
//   { keys: ["intra_paragraph_structure", "inter_paragraph_structure"] }, // 조직
//   { keys: ["grammar", "vocabulary", "sentence_expression"] },        // 표현
// ];
// const ORDERED_KEYS = GROUPS.flatMap((g) => g.keys);

// const adjustScore = (key, value) => {
//   const v = typeof value === "number" ? value : 0;
//   switch (key) {
//     case "grammar":
//     case "vocabulary":
//     case "sentence_expression":
//       return v * 2; // 표현: 2배(6→12)
//     case "intra_paragraph_structure":
//     case "inter_paragraph_structure":
//     case "topic_clarity":
//     case "narrative":
//     case "originality":
//       return v * 5; // 내용/조직: 5배(15→75)
//     default:
//       return v;
//   }
// };
// const weightOf = (key) =>
//   ["grammar", "vocabulary", "sentence_expression"].includes(key) ? 2 : 5;

// export default function Feedback() {
//   const { language } = useLanguage();
//   const { isLoading, setIsLoading } = useLoadingContext();
//   const T = (k) => LABELS?.[k]?.[language] ?? k;
//   const rootRef = useRef(null);
//   const location = useLocation();

//   const [error, setError] = useState("");
//   const [aiMd, setAiMd] = useState("");
//   const [payload, setPayload] = useState(null);

//   // 통계 계산(문자수/문장수/문단수/평균 문장 길이)
//   useEffect(() => {
//     const root = rootRef.current;
//     if (!root) return;
//     const $ = (sel, r = root) => r.querySelector(sel);

//     const mainInput = $("#mainText");
//     function computeStats() {
//       const text = (mainInput?.value || "").replace(/\r/g, "");
//       const noSpace = text.replace(/\s/g, "");
//       const sentList = text
//         .split(/(?<=[.!?…])\s+|\n+/)
//         .map((s) => s.trim())
//         .filter(Boolean);
//       const paraList = text.split(/\n{2,}|\n(?=\s*\n)/).filter(Boolean);
//       const words = text.trim() ? text.trim().split(/\s+/).length : 0;
//       const sents = sentList.length || 1;

//       $("#chars").textContent = `${noSpace.length}${T("chars_unit")}`;
//       $("#sents").textContent = `${sentList.length}${T("count_unit")}`;
//       $("#paras").textContent = `${paraList.length || (text ? 1 : 0)}${T(
//         "count_unit"
//       )}`;
//       $("#avglen").textContent = `${Math.round(words / sents) || 0} ${T(
//         "words_unit"
//       )}`;
//       // ✔ 요구사항: "과제 기준(≥1996자)" 제거 → 관련 갱신/표시 로직도 삭제
//     }
//     computeStats();
//   }, [language]);

//   // payload 로드 + 피드백 생성
//   useEffect(() => {
//     const root = rootRef.current;
//     if (!root) return;
//     const mainInput = root.querySelector("#mainText");
//     if (!mainInput) return;

//     let p = location.state?.payload;
//     if (!p) {
//       try {
//         const cached = sessionStorage.getItem("feedback_payload");
//         if (cached) p = JSON.parse(cached);
//       } catch {}
//     }
//     setPayload(p || null);

//     const original = p?.essay_score?.text ?? p?.contents ?? "";
//     mainInput.value = original || "";

//     async function runFeedbackGeneration(payloadData) {
//       if (!payloadData?.essay_score) {
//         setError("채점 데이터가 없어 피드백을 생성할 수 없습니다.");
//         return;
//       }

//       setError("");
//       setIsLoading(true);
//       setAiMd("");
//       try {
//         const rs = payloadData.essay_score;

//         const requestBody = {
//           original_text: rs.text,
//           feat29: rs.feat29,
//           rubric_scores: {
//             grammar: rs.grammar,
//             vocabulary: rs.vocabulary,
//             sentence_expression: rs.sentence_expression,
//             inter_paragraph_structure: rs.inter_paragraph_structure,
//             intra_paragraph_structure: rs.intra_paragraph_structure,
//             structural_consistency: rs.structural_consistency,
//             length: rs.length,
//             topic_clarity: rs.topic_clarity,
//             originality: rs.originality,
//             prompt_comprehension: rs.prompt_comprehension,
//             narrative: rs.narrative,
//           },
//           top_k_features: rs.top_k_features || [],
//         };

//         const base = process.env.REACT_APP_API_URI || "";
//         const res = await fetch(`${base}/feedback/generate`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(requestBody),
//         });

//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         setAiMd(data.final_markdown || "");
//       } catch (e) {
//         setError(String(e?.message || e));
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     if (p) runFeedbackGeneration(p);
//   }, [location.state, setIsLoading]);

//   // Lexical level distribution
//   const lexDist = useMemo(() => {
//     const rows = ["1", "2", "3", "4", "5"].map((lv) => ({
//       key: lv,
//       label: T(`level_${lv}`),
//       value: 0,
//     }));
//     const vg = payload?.results?.voc_grades;
//     if (!Array.isArray(vg)) return rows;

//     let total = 0;
//     for (const [gradeRaw, entries] of vg) {
//       const grade = String(gradeRaw);
//       if (!["1", "2", "3", "4", "5"].includes(grade)) continue;
//       if (!Array.isArray(entries)) continue;
//       for (const e of entries) {
//         const cnt = Number(e?.cnt) || 0;
//         rows[Number(grade) - 1].value += cnt;
//         total += cnt;
//       }
//     }
//     if (total > 0) {
//       for (const r of rows) r.value = Math.round((r.value / total) * 100);
//     }
//     return rows;
//   }, [payload, language]);

//   // 루브릭 표(가중치 적용)
//   const rubricRows = useMemo(() => {
//     const rs = payload?.essay_score ?? payload?.results?.essay_score ?? null;
//     if (!rs) return [];

//     const L = (k, fallback) => LABELS?.[k]?.[language] ?? fallback;

//     const labelMap = {
//       grammar: L("rubric_grammar", "문법"),
//       vocabulary: L("rubric_vocabulary", "어휘"),
//       sentence_expression: L("rubric_sentence_expression", "문장 표현"),
//       intra_paragraph_structure: L(
//         "rubric_intra_paragraph_structure",
//         "문단 내 구조"
//       ),
//       inter_paragraph_structure: L(
//         "rubric_inter_paragraph_structure",
//         "문단 간 구조"
//       ),
//       topic_clarity: L("rubric_topic_clarity", "주제 명확성"),
//       originality: L("rubric_originality", "독창성"),
//       narrative: L("rubric_narrative", "서사/전개"),
//     };

//     // ORDERED_KEYS 기준으로 노출(구조적 일관성, 분량 제외)
//     const rows = ORDERED_KEYS.map((key) => {
//       const raw = typeof rs[key] === "number" ? rs[key] : 0;
//       const adj = adjustScore(key, raw); // 가중 점수
//       const rawMax = MAX_SCORES[key] || 0;
//       const w = weightOf(key);
//       const adjMax = rawMax * w; // 막대 % 기준은 "가중 최대치"
//       const percent = rawMax > 0 ? Math.max(0, Math.min(100, Math.round((adj / adjMax) * 100))) : 0;

//       return {
//         key,
//         label: labelMap[key] || key,
//         raw,
//         adj,
//         rawMax,
//         adjMax,
//         percent,
//       };
//     });

//     return rows;
//   }, [payload, language]);

//   return (
//     <section ref={rootRef} className="fb-wrap">
//       <style>{`
//         .fb-wrap{max-width:1200px;margin:24px auto;padding:0 16px;color:#e2e8f0}
//         .fb-grid{display:grid;grid-template-columns:1.4fr 0.6fr;gap:16px}
//         .fb-card{position:relative;background:rgba(15,23,42,.9);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
//         .fb-title{font-weight:800;font-size:18px;margin:0 0 12px}
//         .fb-sub{color:#94a3b8;font-size:13px}

//         .fb-input, .fb-textarea{
//           width:100%;
//           border:1px solid rgba(255,255,255,.12);
//           background:#0b1220;color:#e2e8f0;border-radius:12px;padding:12px;
//         }
//         .fb-input::placeholder, .fb-textarea::placeholder{color:#94a3b8}
//         .fb-textarea{min-height:240px;resize:none;line-height:1.6}

//         .fb-readonly{ caret-color:transparent; pointer-events:auto; }
//         .fb-readonly:focus{ outline:none }
//         .fb-readonly[readonly]{ cursor:default }
//         .fb-readonly::-webkit-scrollbar{width:8px;height:8px}
//         .fb-readonly::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px}

//         .fb-panel{position:sticky;top:16px;height:fit-content}
//         .fb-stat-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,0.08);font-size:14px}
//         .fb-badge{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12)}
//         .fb-ok{color:#10b981;border-color:#10b98133;background:#10b98119}
//         .fb-danger{color:#ef4444;border-color:#ef444433;background:#ef444419}
//         .fb-section-title{margin:24px 0 8px;font-weight:800}

//         .fb-md { line-height:1.7; font-size:14px; color:#e2e8f0 }
//         .fb-md h2, .fb-md h3 { margin:16px 0 8px; font-weight:800 }
//         .fb-md h2 { font-size:18px }
//         .fb-md h3 { font-size:16px }
//         .fb-md p { margin:8px 0 }
//         .fb-md ul, .fb-md ol { padding-left:20px; margin:8px 0 }
//         .fb-md table { width:100%; border-collapse:collapse; margin:8px 0 }
//         .fb-md th, .fb-md td { border:1px solid rgba(255,255,255,.12); padding:8px; vertical-align:top }
//         .fb-md thead th { background:rgba(255,255,255,.06) }
//         .fb-md code { background:rgba(255,255,255,.08); padding:2px 4px; border-radius:4px }

//         .lex{margin-top:8px}
//         .lex-row{display:flex;align-items:center;gap:8px;margin:6px 0}
//         .lex-name{width:52px;color:#94a3b8;font-size:12px}
//         .lex-bar{flex:1;height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
//         .lex-fill{height:100%;background:linear-gradient(90deg,#60a5fa,#16a34a)}
//         .lex-val{width:44px;text-align:right;font-size:12px;color:#cbd5e1}

//         .fb-loading-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.6);border-radius:16px;backdrop-filter:blur(2px);z-index:5}
//         .fb-loader{display:flex;align-items:center;gap:10px;font-size:14px;color:#cbd5e1}
//         .fb-spinner{width:22px;height:22px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:spin 0.9s linear infinite}
//         @keyframes spin{to{transform:rotate(360deg)}}
//         .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

//         /* 루브릭 표 */
//         .rb-table{width:100%;border-collapse:collapse;margin-top:8px}
//         .rb-table th, .rb-table td{border:1px solid rgba(255,255,255,.12);padding:8px;font-size:13px}
//         .rb-table thead th{background:rgba(255,255,255,.06)}
//         .rb-bar{height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
//         .rb-fill{height:100%;background:linear-gradient(90deg,#a78bfa,#34d399)}
//       `}</style>

//       <div className="fb-grid">
//         {/* 상단: 원문 */}
//         <div className="fb-card" style={{ gridColumn: "1 / -1" }}>
//           <div className="fb-title">
//             {LABELS.feedback_main[language]}
//             <button
//               className="fb-badge"
//               onClick={() => {
//                 const text =
//                   rootRef.current?.querySelector("#mainText")?.value || "";
//                 navigator.clipboard.writeText(text);
//               }}
//               style={{ marginLeft: 8 }}
//             >
//               {LABELS.copy[language]}
//             </button>
//           </div>
//           <textarea
//             id="mainText"
//             className="fb-textarea fb-readonly"
//             placeholder={LABELS.input_origin[language]}
//             readOnly
//             aria-readonly="true"
//             style={{ userSelect: "text", WebkitUserSelect: "text" }}
//           />
//         </div>

//         {/* 가운데: AI 피드백 */}
//         <div className="fb-card">
//           <div className="fb-title">
//             {LABELS.ai_fb[language]}
//             {isLoading && (
//               <span className="fb-sub"> · {LABELS.fb_gene[language]}</span>
//             )}
//             {error && (
//               <span className="fb-sub" style={{ color: "#ef4444" }}>
//                 {" "}
//                 · {error}
//               </span>
//             )}
//             <button
//               className="fb-badge"
//               onClick={() => navigator.clipboard.writeText(aiMd || "")}
//               style={{ marginLeft: 8 }}
//               disabled={!aiMd}
//               title={LABELS.copy[language]}
//             >
//               {LABELS.copy[language]}
//             </button>
//           </div>

//           {isLoading && (
//             <div className="fb-loading-overlay" role="status" aria-live="polite">
//               <div className="fb-loader">
//                 <div className="fb-spinner" aria-hidden="true" />
//                 <span>{LABELS.fb_gene[language]}</span>
//                 <span className="sr-only">Loading</span>
//               </div>
//             </div>
//           )}

//           <div className="fb-md" aria-busy={isLoading}>
//             <ReactMarkdown remarkPlugins={[remarkGfm]}>
//               {aiMd || (isLoading ? "" : LABELS.no_content[language])}
//             </ReactMarkdown>
//           </div>
//         </div>

//         {/* 우측 패널: 통계 + (루브릭 → Lexical) */}
//         <aside className="fb-panel">
//           <div className="fb-card">
//             <div className="fb-title">{LABELS.stats_title[language]}</div>
//             <div className="fb-stat-row">
//               <span>{LABELS.chars[language]}</span> <span id="chars">—</span>
//             </div>
//             <div className="fb-stat-row">
//               <span>{LABELS.sentences[language]}</span>{" "}
//               <span id="sents">—</span>
//             </div>
//             <div className="fb-stat-row">
//               <span>{LABELS.paragraphs[language]}</span>{" "}
//               <span id="paras">—</span>
//             </div>
//             <div className="fb-stat-row">
//               <span>{LABELS.avg_sentence_len[language]}</span>{" "}
//               <span id="avglen">—</span>
//             </div>
//             {/* ✔ 요구사항: '과제 기준(≥1996자)' 행 제거 */}

//             {/* ✅ 1) 루브릭 (가중치 적용) */}
//             <div className="fb-section-title" style={{ marginTop: 16 }}>
//               {LABELS?.rubric_title?.[language] ?? "루브릭"}
//             </div>
//             {rubricRows.length > 0 ? (
//               <table className="rb-table" role="table" aria-label="rubric table">
//                 <thead>
//                   <tr>
//                     <th style={{ width: "45%" }}>
//                       {LABELS?.rubric_item?.[language] ?? "항목"}
//                     </th>
//                     <th style={{ width: "18%" }}>
//                       {LABELS?.rubric_score?.[language] ?? "점수"}
//                     </th>
//                     <th>
//                       {LABELS?.rubric_visual?.[language] ?? "시각화"}
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {rubricRows.map((r) => (
//                     <tr key={r.key}>
//                       <td>{r.label}</td>
//                       <td
//                         style={{
//                           textAlign: "right",
//                           fontVariantNumeric: "tabular-nums",
//                         }}
//                         title={`raw: ${r.raw} / ${r.rawMax}`}
//                       >
//                         {/* 표시는 가중 점수 / 원만점(요청 코드 스타일) */}
//                         {r.adj} / {r.rawMax}
//                       </td>
//                       <td>
//                         <div className="rb-bar" title={`max(adjusted): ${r.adjMax}`}>
//                           <div
//                             className="rb-fill"
//                             style={{ width: `${r.percent}%` }}
//                           />
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : (
//               <div className="fb-sub">
//                 {LABELS?.no_rubric?.[language] ?? "루브릭 데이터가 없습니다."}
//               </div>
//             )}

//             {/* ✅ 2) Lexical level distribution (루브릭 아래로 이동) */}
//             <div className="fb-section-title" style={{ marginTop: 16 }}>
//               {LABELS.lex_dist_title[language]}
//             </div>
//             <div className="lex">
//               {lexDist.map((row) => (
//                 <div className="lex-row" key={row.key}>
//                   <div className="lex-name">{row.label}</div>
//                   <div className="lex-bar">
//                     <div
//                       className="lex-fill"
//                       style={{ width: `${row.value}%` }}
//                     ></div>
//                   </div>
//                   <div className="lex-val">{row.value}%</div>
//                 </div>
//               ))}
//             </div>
//             <div className="fb-sub">{LABELS.lex_dist_note[language]}</div>
//           </div>
//         </aside>
//       </div>
//     </section>
//   );
// }





















// // src/pages/Feedback.jsx
// import React, { useEffect, useRef, useState, useMemo } from "react";
// import { useLanguage } from "../contexts/LanguageContext";
// import { LABELS } from "../labels";
// import { useLocation } from "react-router-dom";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// // 🔹 전역 로딩 컨텍스트 사용
// import { useLoadingContext } from "../contexts/LoadingContext";

// export default function Feedback() {
//   const { language } = useLanguage();
//   const { isLoading, setIsLoading } = useLoadingContext(); // 🔹 전역 로딩
//   const T = (k) => LABELS?.[k]?.[language] ?? k; // 라벨 헬퍼
//   const rootRef = useRef(null);
//   const location = useLocation();

//   const [error, setError] = useState("");
//   const [aiMd, setAiMd] = useState("");
//   const [payload, setPayload] = useState(null);

//   // 통계 계산(최초 1회 + 언어 변경 시 텍스트 갱신)
//   useEffect(() => {
//     const root = rootRef.current;
//     if (!root) return;
//     const $ = (sel, r = root) => r.querySelector(sel);

//     const mainInput = $("#mainText");
//     function computeStats() {
//       const text = (mainInput?.value || "").replace(/\r/g, "");
//       const noSpace = text.replace(/\s/g, "");
//       const sentList = text
//         .split(/(?<=[.!?…])\s+|\n+/)
//         .map((s) => s.trim())
//         .filter(Boolean);
//       const paraList = text.split(/\n{2,}|\n(?=\s*\n)/).filter(Boolean);
//       const words = text.trim() ? text.trim().split(/\s+/).length : 0;
//       const sents = sentList.length || 1;

//       $("#chars").textContent = `${noSpace.length}${T("chars_unit")}`;
//       $("#sents").textContent = `${sentList.length}${T("count_unit")}`;
//       $("#paras").textContent = `${paraList.length || (text ? 1 : 0)}${T("count_unit")}`;
//       $("#avglen").textContent = `${Math.round(words / sents) || 0} ${T("words_unit")}`;

//       const quota = $("#quota");
//       if (noSpace.length >= 600) {
//         quota.textContent = T("quota_ok");
//         quota.className = "fb-badge fb-ok";
//       } else {
//         quota.textContent = T("quota_fail");
//         quota.className = "fb-badge fb-danger";
//       }
//     }
//     computeStats();
//   }, [language]);

//   // ResultsCoh → Feedback payload 읽고, GPT 호출
//   useEffect(() => {
//     const root = rootRef.current;
//     if (!root) return;
//     const mainInput = root.querySelector("#mainText");
//     if (!mainInput) return;

//     // 1. 이전 페이지에서 넘어온 전체 분석 결과(payload)를 가져옵니다.
//     let p = location.state?.payload;
//     if (!p) {
//       try {
//         const cached = sessionStorage.getItem("feedback_payload");
//         if (cached) p = JSON.parse(cached);
//       } catch {}
//     }
//     setPayload(p || null);

//     // 2. payload에서 원문을 추출하여 화면에 표시합니다.
//     const original = p?.essay_score?.text ?? p?.contents ?? "";
//     mainInput.value = original || "";

//     // 3. 피드백 생성 함수 정의
//     async function runFeedbackGeneration(payloadData) {
//       if (!payloadData?.essay_score) {
//         setError("채점 데이터가 없어 피드백을 생성할 수 없습니다.");
//         return;
//       }

//       setError("");
//       setIsLoading(true);
//       setAiMd("");
//       try {
//         const rs = payloadData.essay_score; // 채점 결과 전체를 사용

//         //  API 요청 본문(body)에 원문, 자질, 루브릭 점수를 모두 담습니다.
//         const requestBody = {
//           original_text: rs.text,
//           feat29: rs.feat29,
//           rubric_scores: {
//             grammar: rs.grammar,
//             vocabulary: rs.vocabulary,
//             sentence_expression: rs.sentence_expression,
//             inter_paragraph_structure: rs.inter_paragraph_structure,
//             intra_paragraph_structure: rs.intra_paragraph_structure,
//             structural_consistency: rs.structural_consistency,
//             length: rs.length,
//             topic_clarity: rs.topic_clarity,
//             originality: rs.originality,
//             prompt_comprehension: rs.prompt_comprehension,
//             narrative: rs.narrative,
//           },
//           top_k_features: rs.top_k_features || [],
//         };
        
//         const base = process.env.REACT_APP_API_URI || "";
//         const res = await fetch(`${base}/feedback/generate`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(requestBody), // 모든 정보가 담긴 body 사용
//         });

//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         setAiMd(data.final_markdown || "");
//       } catch (e) {
//         setError(String(e?.message || e));
//       } finally {
//         setIsLoading(false);
//       }
//     }
    
//     // 4. payload 데이터가 있으면 자동으로 피드백 생성을 실행합니다.
//     if (p) {
//         runFeedbackGeneration(p);
//     }

//   }, [location.state, setIsLoading]);

//   // === 어휘 등급 분포: 1~5 + NA (등장빈도 cnt 가중) ===
//   const lexDist = useMemo(() => {
//     const rows = ["1","2","3","4","5"].map(lv => ({ key: lv, label: T(`level_${lv}`), value: 0 }));
//     const vg = payload?.results?.voc_grades;
//     if (!Array.isArray(vg)) return rows;

//     let total = 0;
//     for (const [gradeRaw, entries] of vg) {
//       const grade = String(gradeRaw);
//       if (!["1","2","3","4","5"].includes(grade)) continue;
//       if (!Array.isArray(entries)) continue;
//       for (const e of entries) {
//         const cnt = Number(e?.cnt) || 0;
//         rows[Number(grade)-1].value += cnt;
//         total += cnt;
//       }
//     }
//     if (total > 0) {
//       for (const r of rows) r.value = Math.round((r.value / total) * 100);
//     }
//     return rows;
//   }, [payload, language]);

//   return (
//     <section ref={rootRef} className="fb-wrap">
//       <style>{`
//         .fb-wrap{max-width:1200px;margin:24px auto;padding:0 16px;color:#e2e8f0}
//         .fb-grid{display:grid;grid-template-columns:1.4fr 0.6fr;gap:16px}
//         .fb-card{position:relative;background:rgba(15,23,42,.9);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
//         .fb-title{font-weight:800;font-size:18px;margin:0 0 12px}
//         .fb-sub{color:#94a3b8;font-size:13px}

//         .fb-input, .fb-textarea{
//           width:100%;
//           border:1px solid rgba(255,255,255,.12);
//           background:#0b1220;color:#e2e8f0;border-radius:12px;padding:12px;
//         }
//         .fb-input::placeholder, .fb-textarea::placeholder{color:#94a3b8}
//         .fb-textarea{min-height:240px;resize:none;line-height:1.6}

//         /* 읽기 전용 */
//         .fb-readonly{ caret-color:transparent; pointer-events:auto; }
//         .fb-readonly:focus{ outline:none }
//         .fb-readonly[readonly]{ cursor:default }
//         .fb-readonly::-webkit-scrollbar{width:8px;height:8px}
//         .fb-readonly::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px}

//         /* 우측 패널/통계 */
//         .fb-panel{position:sticky;top:16px;height:fit-content}
//         .fb-stat-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,0.08);font-size:14px}
//         .fb-badge{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12)}
//         .fb-ok{color:#10b981;border-color:#10b98133;background:#10b98119}
//         .fb-danger{color:#ef4444;border-color:#ef444433;background:#ef444419}
//         .fb-section-title{margin:24px 0 8px;font-weight:800}

//         /* 렌더링된 마크다운 */
//         .fb-md { line-height:1.7; font-size:14px; color:#e2e8f0 }
//         .fb-md h2, .fb-md h3 { margin:16px 0 8px; font-weight:800 }
//         .fb-md h2 { font-size:18px }
//         .fb-md h3 { font-size:16px }
//         .fb-md p { margin:8px 0 }
//         .fb-md ul, .fb-md ol { padding-left:20px; margin:8px 0 }
//         .fb-md table { width:100%; border-collapse:collapse; margin:8px 0 }
//         .fb-md th, .fb-md td { border:1px solid rgba(255,255,255,.12); padding:8px; vertical-align:top }
//         .fb-md thead th { background:rgba(255,255,255,.06) }
//         .fb-md code { background:rgba(255,255,255,.08); padding:2px 4px; border-radius:4px }

//         /* ✅ 표 hover 하이라이트 방지(전역 스타일 충돌 대비) */
//         .fb-md table tr:hover,
//         .fb-md table td:hover,
//         .fb-md table th:hover { background: transparent !important; }

//         /* 사고도구어 막대 */
//         .lex{margin-top:8px}
//         .lex-row{display:flex;align-items:center;gap:8px;margin:6px 0}
//         .lex-name{width:52px;color:#94a3b8;font-size:12px}
//         .lex-bar{flex:1;height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
//         .lex-fill{height:100%;background:linear-gradient(90deg,#60a5fa,#16a34a)}
//         .lex-val{width:44px;text-align:right;font-size:12px;color:#cbd5e1}

//         /* 🔹 로딩 오버레이 */
//         .fb-loading-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.6);border-radius:16px;backdrop-filter:blur(2px);z-index:5}
//         .fb-loader{display:flex;align-items:center;gap:10px;font-size:14px;color:#cbd5e1}
//         .fb-spinner{width:22px;height:22px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:spin 0.9s linear infinite}
//         @keyframes spin{to{transform:rotate(360deg)}}
//         .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
//       `}</style>

//       <div className="fb-grid">
//         {/* 상단: 피드백 본문 */}
//         <div className="fb-card" style={{ gridColumn: "1 / -1" }}>
//           <div className="fb-title">
//             {LABELS.feedback_main[language]}
//             <button
//               className="fb-badge"
//               onClick={() => {
//                 const text = rootRef.current?.querySelector("#mainText")?.value || "";
//                 navigator.clipboard.writeText(text);
//               }}
//               style={{ marginLeft: 8 }}
//             >
//               {LABELS.copy[language]}
//             </button>
//           </div>
//           <textarea
//             id="mainText"
//             className="fb-textarea fb-readonly"
//             placeholder={LABELS.input_origin[language]}
//             readOnly
//             aria-readonly="true"
//             style={{ userSelect: "text", WebkitUserSelect: "text" }}
//           />
//         </div>

//         {/* 가운데: AI 피드백 (마크다운) */}
//         <div className="fb-card">
//           <div className="fb-title">
//             {LABELS.ai_fb[language]}
//             {isLoading && <span className="fb-sub"> · {LABELS.fb_gene[language]}</span>}
//             {error && <span className="fb-sub" style={{ color: "#ef4444" }}> · {error}</span>}
//             <button
//               className="fb-badge"
//               onClick={() => navigator.clipboard.writeText(aiMd || "")}
//               style={{ marginLeft: 8 }}
//               disabled={!aiMd}
//               title={LABELS.copy[language]}
//             >
//               {LABELS.copy[language]}
//             </button>
//           </div>

//           {/* 🔹 로딩 상태일 때 카드 오버레이 표시 */}
//           {isLoading && (
//             <div className="fb-loading-overlay" role="status" aria-live="polite">
//               <div className="fb-loader">
//                 <div className="fb-spinner" aria-hidden="true" />
//                 <span>{LABELS.fb_gene[language]}</span>
//                 <span className="sr-only">Loading</span>
//               </div>
//             </div>
//           )}

//           <div className="fb-md" aria-busy={isLoading}>
//             <ReactMarkdown remarkPlugins={[remarkGfm]}>
//               {aiMd || (isLoading ? "" : LABELS.no_content[language])}
//             </ReactMarkdown>
//           </div>
//         </div>

//         {/* 우측: 통계 + 사고도구어 분포 */}
//         <aside className="fb-panel">
//           <div className="fb-card">
//             <div className="fb-title">{LABELS.stats_title[language]}</div>
//             <div className="fb-stat-row"><span>{LABELS.chars[language]}</span> <span id="chars">—</span></div>
//             <div className="fb-stat-row"><span>{LABELS.sentences[language]}</span> <span id="sents">—</span></div>
//             <div className="fb-stat-row"><span>{LABELS.paragraphs[language]}</span> <span id="paras">—</span></div>
//             <div className="fb-stat-row"><span>{LABELS.avg_sentence_len[language]}</span> <span id="avglen">—</span></div>
//             <div className="fb-stat-row"><span>{LABELS.quota_requirement[language]}</span> <span id="quota" className="fb-badge">—</span></div>

//             <div className="fb-section-title" style={{ marginTop: 16 }}>
//               {LABELS.lex_dist_title[language]}
//             </div>
//             <div className="lex">
//               {lexDist.map((row) => (
//                 <div className="lex-row" key={row.key}>
//                   <div className="lex-name">{row.label}</div>
//                   <div className="lex-bar">
//                     <div className="lex-fill" style={{ width: `${row.value}%` }}></div>
//                   </div>
//                   <div className="lex-val">{row.value}%</div>
//                 </div>
//               ))}
//             </div>
//             <div className="fb-sub">{LABELS.lex_dist_note[language]}</div>
//           </div>
//         </aside>
//       </div>
//     </section>
//   );
// }