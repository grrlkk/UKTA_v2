// src/pages/Feedback.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { LABELS } from "../labels";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Feedback() {
  const { language } = useLanguage();
  const T = (k) => LABELS?.[k]?.[language] ?? k; // 라벨 헬퍼
  const rootRef = useRef(null);
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiMd, setAiMd] = useState("");
  const [payload, setPayload] = useState(null);

  // 통계 계산(최초 1회 + 언어 변경 시 텍스트 갱신)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const $ = (sel, r = root) => r.querySelector(sel);

    const mainInput = $("#mainText");
    function computeStats() {
      const text = (mainInput?.value || "").replace(/\r/g, "");
      const noSpace = text.replace(/\s/g, "");
      const sentList = text
        .split(/(?<=[.!?…])\s+|\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const paraList = text.split(/\n{2,}|\n(?=\s*\n)/).filter(Boolean);
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const sents = sentList.length || 1;

      $("#chars").textContent = `${noSpace.length}${T("chars_unit")}`;
      $("#sents").textContent = `${sentList.length}${T("count_unit")}`;
      $("#paras").textContent = `${paraList.length || (text ? 1 : 0)}${T("count_unit")}`;
      $("#avglen").textContent = `${Math.round(words / sents) || 0} ${T("words_unit")}`;

      const quota = $("#quota");
      if (noSpace.length >= 600) {
        quota.textContent = T("quota_ok");
        quota.className = "fb-badge fb-ok";
      } else {
        quota.textContent = T("quota_fail");
        quota.className = "fb-badge fb-danger";
      }
    }
    computeStats();
  }, [language]);

  // ResultsCoh → Feedback payload 읽고, GPT 호출
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

    const original = p?.results?.correction?.origin ?? p?.contents ?? "";
    mainInput.value = original || "";

    async function run() {
      setError("");
      setLoading(true);
      setAiMd("");
      try {
        const base = process.env.REACT_APP_API_URI || "";
        const res = await fetch(`${base}/feedback/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ original_text: original }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAiMd(data.final_markdown || "");
      } catch (e) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }

    if (original?.trim()) run();
  }, [location.state]);

  // === 어휘 등급 분포: 1~5 + NA (등장빈도 cnt 가중) ===
  const lexDist = useMemo(() => {
    // 1~5만 남김
    const rows = ["1","2","3","4","5"].map(lv => ({ key: lv, label: T(`level_${lv}`), value: 0 }));
  
    const vg = payload?.results?.voc_grades;
    if (!Array.isArray(vg)) return rows;
  
    let total = 0;
    for (const [gradeRaw, entries] of vg) {
      const grade = String(gradeRaw);
      if (!["1","2","3","4","5"].includes(grade)) continue; // ✅ NA(-1/0 등) 제외
      if (!Array.isArray(entries)) continue;
      for (const e of entries) {
        const cnt = Number(e?.cnt) || 0;
        rows[Number(grade)-1].value += cnt;
        total += cnt;
      }
    }
    if (total > 0) {
      for (const r of rows) r.value = Math.round((r.value / total) * 100);
    }
    return rows;
  }, [payload, language]);

  return (
    <section ref={rootRef} className="fb-wrap">
      <style>{`
        .fb-wrap{max-width:1200px;margin:24px auto;padding:0 16px;color:#e2e8f0}
        .fb-grid{display:grid;grid-template-columns:1.4fr 0.6fr;gap:16px}
        .fb-card{background:rgba(15,23,42,.9);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
        .fb-title{font-weight:800;font-size:18px;margin:0 0 12px}
        .fb-sub{color:#94a3b8;font-size:13px}

        .fb-input, .fb-textarea{
          width:100%;
          border:1px solid rgba(255,255,255,.12);
          background:#0b1220;color:#e2e8f0;border-radius:12px;padding:12px;
        }
        .fb-input::placeholder, .fb-textarea::placeholder{color:#94a3b8}
        .fb-textarea{min-height:240px;resize:none;line-height:1.6}

        /* 읽기 전용 */
        .fb-readonly{ caret-color:transparent; pointer-events:auto; }
        .fb-readonly:focus{ outline:none }
        .fb-readonly[readonly]{ cursor:default }
        .fb-readonly::-webkit-scrollbar{width:8px;height:8px}
        .fb-readonly::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px}

        /* 우측 패널/통계 */
        .fb-panel{position:sticky;top:16px;height:fit-content}
        .fb-stat-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,0.08);font-size:14px}
        .fb-badge{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12)}
        .fb-ok{color:#10b981;border-color:#10b98133;background:#10b98119}
        .fb-danger{color:#ef4444;border-color:#ef444433;background:#ef444419}
        .fb-section-title{margin:24px 0 8px;font-weight:800}

        /* 렌더링된 마크다운 */
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

        /* ✅ 표 hover 하이라이트 방지(전역 스타일 충돌 대비) */
        .fb-md table tr:hover,
        .fb-md table td:hover,
        .fb-md table th:hover { background: transparent !important; }

        /* 사고도구어 막대 */
        .lex{margin-top:8px}
        .lex-row{display:flex;align-items:center;gap:8px;margin:6px 0}
        .lex-name{width:52px;color:#94a3b8;font-size:12px}
        .lex-bar{flex:1;height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
        .lex-fill{height:100%;background:linear-gradient(90deg,#60a5fa,#16a34a)}
        .lex-val{width:44px;text-align:right;font-size:12px;color:#cbd5e1}
      `}</style>

      <div className="fb-grid">
        {/* 상단: 피드백 본문 */}
        <div className="fb-card" style={{ gridColumn: "1 / -1" }}>
          <div className="fb-title">
            {LABELS.feedback_main[language]}
            <button
              className="fb-badge"
              onClick={() => {
                const text = rootRef.current?.querySelector("#mainText")?.value || "";
                navigator.clipboard.writeText(text);
              }}
              style={{ marginLeft: 8 }}
            >
              {LABELS.copy[language]}
            </button>
          </div>
          <textarea
            id="mainText"
            className="fb-textarea fb-readonly"
            placeholder={LABELS.input_origin[language]}
            readOnly
            aria-readonly="true"
            style={{ userSelect: "text", WebkitUserSelect: "text" }}
          />
        </div>

        {/* 가운데: AI 피드백 (마크다운) */}
        <div className="fb-card">
          <div className="fb-title">
            {LABELS.ai_fb[language]}
            {loading && <span className="fb-sub"> · {LABELS.fb_gene[language]}</span>}
            {error && <span className="fb-sub" style={{ color: "#ef4444" }}> · {error}</span>}
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
          <div className="fb-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiMd || (loading ? "" : LABELS.no_content[language])}
            </ReactMarkdown>
          </div>
        </div>

        {/* 우측: 통계 + 사고도구어 분포 */}
        <aside className="fb-panel">
          <div className="fb-card">
            <div className="fb-title">{LABELS.stats_title[language]}</div>
            <div className="fb-stat-row"><span>{LABELS.chars[language]}</span> <span id="chars">—</span></div>
            <div className="fb-stat-row"><span>{LABELS.sentences[language]}</span> <span id="sents">—</span></div>
            <div className="fb-stat-row"><span>{LABELS.paragraphs[language]}</span> <span id="paras">—</span></div>
            <div className="fb-stat-row"><span>{LABELS.avg_sentence_len[language]}</span> <span id="avglen">—</span></div>
            <div className="fb-stat-row"><span>{LABELS.quota_requirement[language]}</span> <span id="quota" className="fb-badge">—</span></div>
            <div className="fb-stat-row"><span>{LABELS.estimated_score_title[language]}</span> <span className="fb-badge fb-ok">78~84</span></div>

            <div className="fb-section-title" style={{ marginTop: 16 }}>
              {LABELS.lex_dist_title[language]}
            </div>
            <div className="lex">
              {lexDist.map((row) => (
                <div className="lex-row" key={row.key}>
                  <div className="lex-name">{row.label}</div>
                  <div className="lex-bar">
                    <div className="lex-fill" style={{ width: `${row.value}%` }}></div>
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
