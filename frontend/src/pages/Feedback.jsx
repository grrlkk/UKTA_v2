// src/pages/Feedback.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { LABELS } from "../labels";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLoadingContext } from "../contexts/LoadingContext";
import { EssayTags } from "../Tags";

/* =========================================================
   ▶ EvalFormat.jsx와 동일한 루브릭 체계
========================================================= */
const MAX_SCORES = {
  grammar: 9,
  vocabulary: 6,
  sentence_expression: 6,
  vocab_sentence: 9,

  intra_paragraph_structure: 15,
  inter_paragraph_structure: 15,
  structural_consistency: 15,
  length: 15,
  topic_clarity: 15,
  originality: 15,
  narrative: 15,

  Topic_relevance: 3,
};

const GROUPS = [
  { keys: ["topic_clarity", "narrative", "originality"] }, // 내용
  { keys: ["intra_paragraph_structure", "inter_paragraph_structure"] }, // 조직
  { keys: ["grammar", "vocab_sentence"] }, // 표현
];

const ORDERED_KEYS = GROUPS.flatMap((g) => g.keys);

const TOTAL_BONUS = 7;
const TOTAL_MAX_INCLUDED = ORDERED_KEYS.reduce(
  (acc, key) => acc + (MAX_SCORES[key] || 0),
  0
); // 93
const TOTAL_MAX_WITH_BONUS = TOTAL_MAX_INCLUDED + TOTAL_BONUS; // 100

const RUBRIC_LABELS_KO = {
  vocab_sentence: "어휘와 문장",
  intra_paragraph_structure: "문단 내 조직",
  inter_paragraph_structure: "글 전체 조직",
  topic_clarity: "주장",
  originality: "다른 입장 고려",
  narrative: "이유와 근거",
  grammar: "규범",
};

const RUBRIC_LABELS_EN = {
  vocab_sentence: "Vocabulary & Sentence",
  intra_paragraph_structure: "In-paragraph Structure",
  inter_paragraph_structure: "Inter-paragraph Structure",
  topic_clarity: "Topic Clarity",
  originality: "Originality",
  narrative: "Narrative",
  grammar: "Grammar",
};

const toNumber = (v) =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

const ceilToStep = (value, step) => Math.ceil(value / step) * step;

const adjustScore = (key, value) => {
  const v = typeof value === "number" ? value : 0;

  if (key === "Topic_relevance") return v;

  switch (key) {
    case "grammar":
      return v * 3; // 0/3/6/9
    case "vocabulary":
    case "sentence_expression":
      return v * 2; // 내부 계산용 유지
    case "intra_paragraph_structure":
    case "inter_paragraph_structure":
    case "structural_consistency":
    case "length":
    case "topic_clarity":
    case "narrative":
    case "originality":
      return v * 5; // 0~15
    default:
      return v;
  }
};

const getAdjustedScore = (essayScore, key) => {
  if (!essayScore) return 0;

  if (key === "vocab_sentence") {
    const vRaw = essayScore.vocabulary;
    const sRaw = essayScore.sentence_expression;

    if (vRaw === "Error" || sRaw === "Error") return "Error";

    const sum =
      toNumber(adjustScore("vocabulary", vRaw)) +
      toNumber(adjustScore("sentence_expression", sRaw));

    // 12/8/4/0 → 9/6/3/0
    const scaled = sum * 0.75;
    const stepped = ceilToStep(scaled, 3);

    return Math.min(MAX_SCORES.vocab_sentence, Math.max(0, stepped));
  }

  if (essayScore[key] === "Error") return "Error";
  return adjustScore(key, essayScore[key]);
};

const isLowTopicRelevance = (essayScore) => {
  const v = essayScore?.Topic_relevance;
  const n =
    typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n <= 1;
};

const computeTotalAdjustedScore = (essayScore) => {
  if (!essayScore || isLowTopicRelevance(essayScore)) return 0;

  return (
    ORDERED_KEYS.reduce(
      (acc, key) => acc + toNumber(getAdjustedScore(essayScore, key)),
      0
    ) + TOTAL_BONUS
  );
};

const getRubricLabel = (key, language) => {
  const meta = EssayTags?.[key];

  if (language === "en") {
    return meta?.desc_eng || RUBRIC_LABELS_EN[key] || key;
  }

  return meta?.desc || RUBRIC_LABELS_KO[key] || key;
};

/* =========================================================
   ▶ 하이라이트 유틸
========================================================= */
const SENTENCE_SPLIT_RE = /(?<=[.!?…])\s+|\n+/;

const escHtml = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildNormalizedIndex = (source) => {
  const norm = [];
  const map = [];

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
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

const extractOriginalPhrases = (md) => {
  if (!md) return [];

  const text = md.replace(/\r/g, "");
  const lines = text.split("\n");
  const out = [];

  // 1) 표 형태: | 기존 | 문장 ... |
  for (const line of lines) {
    if (/^\|\s*-{2,}\s*\|\s*-{2,}\s*\|/.test(line)) continue;
    const m = line.match(/^\|\s*기존\s*\|\s*([^|\n]+?)\s*\|/);
    if (m && m[1] && m[1].trim()) {
      out.push(m[1].trim());
    }
  }

  // 2) 인라인: "기존: 문장..." / "기존"
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    const inline = line.match(/^\s*기존\s*[:：]\s*(.+?)\s*$/);
    if (inline && inline[1]) {
      out.push(inline[1].trim());
      continue;
    }

    if (/^\s*기존\s*[:：]?\s*$/.test(line)) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j += 1;
      if (j < lines.length) {
        const cand = lines[j].trim();
        if (cand) out.push(cand);
        i = j;
      }
    }
  }

  return Array.from(new Set(out));
};

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

const mergeRanges = (ranges) => {
  if (!ranges.length) return [];

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const [s, e] = sorted[i];
    const last = out[out.length - 1];

    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }

  return out;
};

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

const buildHighlightedHtmlSmart = (originalText, aiMarkdown) => {
  const source = (originalText || "").replace(/\r/g, "");
  if (!source) return "";

  const phrases = extractOriginalPhrases(aiMarkdown);
  let all = [];

  for (const phrase of phrases) {
    all = all.concat(findRangesByNormalizedMatch(source, phrase));
  }

  if (all.length > 0) {
    return buildHtmlFromRanges(source, mergeRanges(all));
  }

  // 폴백: "문장 #N"
  const idxSet = extractSentenceIndices(aiMarkdown);
  if (idxSet.size > 0) {
    const sentences = source
      .split(SENTENCE_SPLIT_RE)
      .map((s) => s.trim())
      .filter(Boolean);

    let html = "";
    let cursor = 0;
    let idx = 0;

    for (const sentence of sentences) {
      const pos = source.indexOf(sentence, cursor);
      if (pos === -1) continue;

      const prefix = source.slice(cursor, pos);
      html += escHtml(prefix).replace(/\n/g, "<br/>");

      idx += 1;
      const body = escHtml(sentence);
      html += idxSet.has(idx) ? `<mark class="hl">${body}</mark>` : body;

      cursor = pos + sentence.length;
    }

    html += escHtml(source.slice(cursor)).replace(/\n/g, "<br/>");
    return html;
  }

  return escHtml(source).replace(/\n/g, "<br/>");
};

/* =========================================================
   ▶ 컴포넌트
========================================================= */
export default function Feedback() {
  const { language } = useLanguage();
  const { isLoading, setIsLoading } = useLoadingContext();
  const location = useLocation();

  const hlRef = useRef(null);

  const [error, setError] = useState("");
  const [aiMd, setAiMd] = useState("");
  const [payload, setPayload] = useState(null);

  const T = (k) => LABELS?.[k]?.[language] ?? k;

  useEffect(() => {
    let p = location.state?.payload;

    if (!p) {
      try {
        const cached = sessionStorage.getItem("feedback_payload");
        if (cached) p = JSON.parse(cached);
      } catch {
        // noop
      }
    }

    setPayload(p || null);
  }, [location.state]);

  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, [setIsLoading]);

  const essayScore = useMemo(
    () => payload?.essay_score ?? payload?.results?.essay_score ?? null,
    [payload]
  );

  const originalText = useMemo(
    () => (essayScore?.text ?? payload?.contents ?? "").replace(/\r/g, ""),
    [essayScore, payload]
  );

  useEffect(() => {
    let cancelled = false;

    async function runFeedbackGeneration() {
      if (!essayScore) {
        setAiMd("");
        setError("채점 데이터가 없어 피드백을 생성할 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setError("");
      setAiMd("");
      setIsLoading(true);

      try {
        // 백엔드 호환성을 위해 raw rubric_scores 구조는 유지하고,
        // 화면 표시 루브릭만 EvalFormat.jsx와 동일하게 맞춥니다.
        const requestBody = {
          original_text: essayScore.text,
          feat29: essayScore.feat29,
          rubric_scores: {
            grammar: essayScore.grammar,
            vocabulary: essayScore.vocabulary,
            sentence_expression: essayScore.sentence_expression,
            inter_paragraph_structure: essayScore.inter_paragraph_structure,
            intra_paragraph_structure: essayScore.intra_paragraph_structure,
            structural_consistency: essayScore.structural_consistency,
            length: essayScore.length,
            topic_clarity: essayScore.topic_clarity,
            originality: essayScore.originality,
            prompt_comprehension: essayScore.prompt_comprehension,
            narrative: essayScore.narrative,
            Topic_relevance: essayScore.Topic_relevance,
          },
          top_k_features: essayScore.top_k_features || [],
        };

        const base = process.env.REACT_APP_API_URI || "";
        const res = await fetch(`${base}/feedback/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!cancelled) {
          setAiMd(data.final_markdown || "");
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e?.message || e));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    runFeedbackGeneration();

    return () => {
      cancelled = true;
    };
  }, [essayScore, setIsLoading]);

  const hlHtml = useMemo(
    () => buildHighlightedHtmlSmart(originalText, aiMd),
    [originalText, aiMd]
  );

  const stats = useMemo(() => {
    const text = originalText.replace(/\r/g, "");
    const noSpace = text.replace(/\s/g, "");
    const sentList = text
      .split(SENTENCE_SPLIT_RE)
      .map((s) => s.trim())
      .filter(Boolean);
    const paraList = text
      .split(/\n{2,}|\n(?=\s*\n)/)
      .map((p) => p.trim())
      .filter(Boolean);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sents = sentList.length || 1;

    return {
      chars: `${noSpace.length}${T("chars_unit")}`,
      sents: `${sentList.length}${T("count_unit")}`,
      paras: `${paraList.length || (text ? 1 : 0)}${T("count_unit")}`,
      avglen: `${Math.round(words / sents) || 0} ${T("words_unit")}`,
    };
  }, [originalText, language]);

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
      for (const r of rows) {
        r.value = Math.round((r.value / total) * 100);
      }
    }

    return rows;
  }, [payload, language]);

  const rubricRows = useMemo(() => {
    if (!essayScore) return [];

    return ORDERED_KEYS.map((key) => {
      const score = getAdjustedScore(essayScore, key);
      const isError = score === "Error";
      const numeric = isError ? 0 : toNumber(score);
      const max = MAX_SCORES[key] || 0;
      const percent =
        max > 0
          ? Math.max(0, Math.min(100, Math.round((numeric / max) * 100)))
          : 0;

      return {
        key,
        label: getRubricLabel(key, language),
        score,
        max,
        percent,
        isError,
      };
    });
  }, [essayScore, language]);

  const totalScore = useMemo(
    () => computeTotalAdjustedScore(essayScore),
    [essayScore]
  );

  const topicLimited = useMemo(
    () => isLowTopicRelevance(essayScore),
    [essayScore]
  );

  const rubricNote = useMemo(() => {
    if (!essayScore) return "";

    if (topicLimited) {
      return language === "en"
        ? "Scoring is limited because topic relevance is low. Please write an essay that matches the prompt."
        : "주제 적합성이 낮아 채점이 제한됩니다. 발문에 적합한 글을 작성하세요.";
    }

    return language === "en"
      ? "A default score of +5 is added to Content and +2 to Expression."
      : "내용(Content)과 표현(Expression) 항목에 각각 기본 점수(default score) +5점, +2점이 부여됩니다.";
  }, [essayScore, topicLimited, language]);

  return (
    <section className="fb-wrap">
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

        .fb-readonly{caret-color:transparent;pointer-events:auto}
        .fb-readonly:focus{outline:none}
        .fb-readonly[readonly]{cursor:default}
        .fb-readonly::-webkit-scrollbar{width:8px;height:8px}
        .fb-readonly::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px}

        .fb-panel{position:sticky;top:16px;height:fit-content}
        .fb-stat-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,0.08);font-size:14px}
        .fb-badge{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12)}
        .fb-section-title{margin:24px 0 8px;font-weight:800}

        .fb-md{line-height:1.7;font-size:14px;color:#e2e8f0}
        .fb-md h2,.fb-md h3{margin:16px 0 8px;font-weight:800}
        .fb-md h2{font-size:18px}
        .fb-md h3{font-size:16px}
        .fb-md p{margin:8px 0}
        .fb-md ul,.fb-md ol{padding-left:20px;margin:8px 0}
        .fb-md table{width:100%;border-collapse:collapse;margin:8px 0}
        .fb-md th,.fb-md td{border:1px solid rgba(255,255,255,.12);padding:8px;vertical-align:top}
        .fb-md thead th{background:rgba(255,255,255,.06)}
        .fb-md code{background:rgba(255,255,255,.08);padding:2px 4px;border-radius:4px}

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

        .rb-table{width:100%;border-collapse:collapse;margin-top:8px}
        .rb-table th,.rb-table td{border:1px solid rgba(255,255,255,.12);padding:8px;font-size:13px}
        .rb-table thead th{background:rgba(255,255,255,.06)}
        .rb-bar{height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
        .rb-fill{height:100%;display:block}

        .fb-note{margin-top:10px;padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.5;background:rgba(255,255,255,.04);color:#cbd5e1}
        .fb-note-danger{background:rgba(239,68,68,.12);color:#fecaca;border:1px solid rgba(239,68,68,.2)}

        .fb-textstack{position:relative}
        .fb-textarea.fb-ghost{
          color:transparent;
          caret-color:transparent;
          background:transparent;
        }
        .fb-text-hl{
          position:absolute;inset:0;padding:12px;
          overflow:auto;pointer-events:none;
          white-space:pre-wrap;word-break:break-word;
          line-height:1.6;font-size:14px;
          color:#e2e8f0;z-index:1;
        }
        .fb-text-hl mark.hl{
          background:#fde68a;color:#111827;
          padding:0 2px;border-radius:3px;
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
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(originalText || "");
                }
              }}
              style={{ marginLeft: 8 }}
              disabled={!originalText}
              title={LABELS.copy[language]}
            >
              {LABELS.copy[language]}
            </button>
          </div>

          <div className="fb-textstack">
            <div
              id="mainTextHL"
              ref={hlRef}
              className="fb-text-hl"
              dangerouslySetInnerHTML={{ __html: hlHtml }}
              aria-hidden="true"
            />
            <textarea
              id="mainText"
              className="fb-textarea fb-readonly fb-ghost"
              placeholder={LABELS.input_origin[language]}
              value={originalText}
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
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(aiMd || "");
                }
              }}
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

        {/* 우측 패널 */}
        <aside className="fb-panel">
          <div className="fb-card">
            <div className="fb-title">{LABELS.stats_title[language]}</div>

            <div className="fb-stat-row">
              <span>{LABELS.chars[language]}</span>
              <span>{stats.chars}</span>
            </div>
            <div className="fb-stat-row">
              <span>{LABELS.sentences[language]}</span>
              <span>{stats.sents}</span>
            </div>
            <div className="fb-stat-row">
              <span>{LABELS.paragraphs[language]}</span>
              <span>{stats.paras}</span>
            </div>
            <div className="fb-stat-row">
              <span>{LABELS.avg_sentence_len[language]}</span>
              <span>{stats.avglen}</span>
            </div>
            <div className="fb-stat-row">
              <span>
                {LABELS.total_score?.[language] ??
                  (language === "en" ? "Total Score" : "총점")}
              </span>
              <span>
                {essayScore ? `${totalScore} / ${TOTAL_MAX_WITH_BONUS}` : "—"}
              </span>
            </div>

            <div className="fb-section-title" style={{ marginTop: 16 }}>
              {LABELS?.essay_score?.[language] ?? "루브릭"}
            </div>

            {rubricRows.length > 0 ? (
              <>
                <table
                  className="rb-table"
                  role="table"
                  aria-label="rubric table"
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          width: "34%",
                          textAlign: "center",
                          padding: "6px 8px",
                          lineHeight: 1.2,
                        }}
                      >
                        {LABELS?.rubric?.[language] ??
                          (language === "en" ? "Rubric" : "항목")}
                      </th>
                      <th
                        style={{
                          width: "22%",
                          textAlign: "center",
                          padding: "6px 8px",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {LABELS?.score?.[language] ??
                          (language === "en" ? "Score" : "점수")}
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "6px 8px",
                          lineHeight: 1.2,
                        }}
                      >
                        {LABELS?.rubric_visual?.[language] ??
                          (language === "en" ? "Visual" : "시각화")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rubricRows.map((row) => (
                      <tr key={row.key}>
                        <td
                          style={{
                            textAlign: "center",
                            padding: "6px 8px",
                            lineHeight: 1.25,
                            wordBreak: "keep-all",
                          }}
                          title={row.label}
                        >
                          {row.label}
                        </td>

                        <td
                          style={{
                            textAlign: "center",
                            padding: "6px 8px",
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            fontVariantNumeric: "tabular-nums",
                          }}
                          title={
                            row.isError ? "N/A" : `${row.score} / ${row.max}`
                          }
                        >
                          {row.isError ? (
                            <span
                              style={{
                                color: "#fda4af",
                                fontStyle: "italic",
                                fontSize: 12,
                              }}
                            >
                              {language === "en" ? "N/A" : "평가 불가"}
                            </span>
                          ) : (
                            <span>{row.score}/{row.max}</span>
                          )}
                        </td>

                        <td style={{ padding: "6px 8px", lineHeight: 1.2 }}>
                          <div
                            className="rb-bar"
                            aria-label={`${Math.round(row.percent)}%`}
                          >
                            <div
                              className="rb-fill"
                              style={{
                                width: `${row.percent}%`,
                                background:
                                  "linear-gradient(90deg,#22d3ee,#34d399)",
                                height: 8,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!!rubricNote && (
                  <div
                    className={`fb-note ${
                      topicLimited ? "fb-note-danger" : ""
                    }`}
                  >
                    {rubricNote}
                  </div>
                )}
              </>
            ) : (
              <div className="fb-sub">
                {LABELS?.no_rubric?.[language] ?? "루브릭 데이터가 없습니다."}
              </div>
            )}

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
                    />
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