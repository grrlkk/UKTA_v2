// /home/ukta/KorCAT-web_v2/frontend/src/pages/cohesion/EvalFormat.jsx

import { Chart as ChartJS, Filler, Legend, LineElement, PointElement, RadialLinearScale, Tooltip } from 'chart.js';
import React, { useEffect, useState } from "react";
import { Radar } from 'react-chartjs-2';
import { CohTags, EssayTags, MorphTags } from "../../Tags";
import { useBatchDownloads } from "../../contexts/BatchDownloadContext"
import { LABELS } from "../../labels";
import { useLanguage } from '../../contexts/LanguageContext';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// 레이더 축(주제 적합성 제외 + 어휘/문장 통합)
const RADAR_KEYS = [
  "topic_clarity",
  "narrative",
  "originality",
  "intra_paragraph_structure",
  "inter_paragraph_structure",
  "grammar",
  "vocab_sentence",
];

const initialRadarData = {
  labels: RADAR_KEYS.map((k) => EssayTags[k]?.desc || k),
  datasets: [],
};

// ▶ 점수 규칙(표시/정규화용 상한)
const MAX_SCORES = {
  // 표현
  grammar: 9,            // 0/3/6/9
  vocabulary: 6,         // (내부 계산용 유지)
  sentence_expression: 6,// (내부 계산용 유지)
  vocab_sentence: 9,     // 0/3/6/9 (어휘+문장 통합)

  // 조직/내용
  intra_paragraph_structure: 15,
  inter_paragraph_structure: 15,
  structural_consistency: 15, // 제외
  length: 15,                 // 제외
  topic_clarity: 15,
  originality: 15,
  narrative: 15,

  // 기타(표에서는 숨김, 로직은 유지)
  Topic_relevance: 3
};

// 총점에서 제외할 키(표에도 숨김)
const EXCLUDED_KEYS = ["structural_consistency", "length"];

// 내부 로직용 그룹(Topic_relevance 유지)
const GROUPS = [
  { keys: ["topic_clarity", "narrative", "originality"] },              // 내용
  { keys: ["intra_paragraph_structure", "inter_paragraph_structure"] }, // 조직
  { keys: ["grammar", "vocab_sentence"] },                              // 표현(통합)
  { keys: ["Topic_relevance"] },                                        // 로직 유지(표에서는 숨김)
];

const ORDERED_KEYS = GROUPS.flatMap(g => g.keys);

// 표에 "보여줄" 키(Topic_relevance 제외)
const TABLE_GROUPS = GROUPS.filter(g => !g.keys.includes("Topic_relevance"));
const TABLE_KEYS = TABLE_GROUPS.flatMap(g => g.keys);

// 점수 변환(원점수 → 표시 점수)
const adjustScore = (key, value) => {
  const v = typeof value === "number" ? value : 0;
  if (key === "Topic_relevance") return v; // 로직 유지(표에서는 숨김)
  switch (key) {
    case "grammar":
      return v * 3; // ✅ 규범: 6/4/2/0 → 9/6/3/0
    case "vocab_sentence":
      return v * 3; // 7개 모델 직접 출력: 0~3 → 0/3/6/9
    case "vocabulary":
    case "sentence_expression":
      return v * 2; // (내부 유지)
    case "intra_paragraph_structure":
    case "inter_paragraph_structure":
    case "structural_consistency":
    case "length":
    case "topic_clarity":
    case "narrative":
    case "originality":
      return v * 5; // 0~3 → 0~15
    default:
      return v;
  }
};

// 정규화용 분모(최대 점수)
const weightedMax = (key) => MAX_SCORES[key] ?? 0;

// 숫자 안전 처리
const toNumber = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

// step 단위 올림(예: 4.1을 step=3이면 6으로)
const ceilToStep = (value, step) => Math.ceil(value / step) * step;

// 주제 적합성 0~1이면 (채점 스킵 조건)
const isLowTopicRelevance = (essayScore) => {
  const v = essayScore?.Topic_relevance;
  const n = typeof v === "number" ? v : (typeof v === "string" ? Number(v) : NaN);
  return Number.isFinite(n) && n <= 1;
};

// 표/레이더에 표시할 "최종 점수" (파생 루브릭 포함)
const getAdjustedScore = (essayScore, key) => {
  if (!essayScore) return 0;

  // 어휘+문장 통합 루브릭
  if (key === "vocab_sentence") {
    const vRaw = essayScore.vocabulary;
    const sRaw = essayScore.sentence_expression;

    if (vRaw === undefined && sRaw === undefined && essayScore.vocab_sentence !== undefined) {
      if (essayScore.vocab_sentence === "Error") return "Error";
      return adjustScore("vocab_sentence", essayScore.vocab_sentence);
    }

    if (vRaw === "Error" || sRaw === "Error") return "Error";

    // 기존(어휘 0~6, 문장표현 0~6) 합: 0~12
    const sum = toNumber(adjustScore("vocabulary", vRaw)) + toNumber(adjustScore("sentence_expression", sRaw));

    // 12/8/4/0 → 9/6/3/0 스케일(×0.75)
    const scaled = sum * 0.75;

    // "딱 안떨어지면 올림" + 0/3/6/9에 맞추기 위해 3점 단위로 올림
    const stepped = ceilToStep(scaled, 3);

    return Math.min(MAX_SCORES.vocab_sentence, Math.max(0, stepped));
  }

  if (essayScore[key] === "Error") return "Error";
  return adjustScore(key, essayScore[key]);
};

// 최대 점수 총합(Topic_relevance 제외)
const TOTAL_MAX_INCLUDED = ORDERED_KEYS
  .filter(k => k !== "Topic_relevance")
  .reduce((acc, k) => acc + (MAX_SCORES[k] || 0), 0); // 93

// 기본점수: 내용 +5, 표현 +2
const TOTAL_BONUS = 7;
const TOTAL_MAX_WITH_BONUS = TOTAL_MAX_INCLUDED + TOTAL_BONUS; // 100

// 레이더 0~1 정규화(점수 / 최대)
const normalizedRadarArray = (essayScore) =>
  RADAR_KEYS.map((k) => toNumber(getAdjustedScore(essayScore, k)) / (weightedMax(k) || 1));

// 총점: Topic_relevance 제외 + 보너스(로직 유지)
const computeTotalAdjustedScore = (essayScore) => {
  // 주제 적합성 0~1이면 기본점수 포함해서 총점 0점 처리
  if (isLowTopicRelevance(essayScore)) return 0;

  return ORDERED_KEYS
    .filter(k => k !== "Topic_relevance")
    .reduce((a, k) => a + toNumber(getAdjustedScore(essayScore, k)), 0)
  + TOTAL_BONUS;
};

// 그룹 rowSpan 메타
const buildGroupMeta = (groups) => {
  const meta = [];
  let start = 0;
  for (const g of groups) {
    meta.push({ start, length: g.keys.length });
    start += g.keys.length;
  }
  return meta;
};

const EvalFormat = ({ result, title, darkMode }) => {
  const [hidden, setHidden] = useState(true);
  const [radarData, setRadarData] = useState(initialRadarData);
  const [tableData, setTableData] = useState([]);
  const [tableMode, setTableMode] = useState(true);
  const [totalScore, setTotalScore] = useState(0);
  const { language } = useLanguage();

  const radarOptions = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: darkMode ? '#1e293b' : '#cbd5e1',
        },
        grid: {
          color: darkMode ? '#1e293b' : '#cbd5e1',
        },
        suggestedMin: 0,
        suggestedMax: 1,
        pointLabels: {
          color: darkMode ? '#f8fafc' : '#313e50',
          font: { weight: 'bold', family: 'Noto Sans KR' },
        },
        ticks: {
          display: true,
          stepSize: 0.2,
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: darkMode ? '#f8fafc' : '#313e50',
          font: { weight: 'bold', family: 'Noto Sans KR' },
        },
      },
    },
    animation: false,
  };

  useEffect(() => {
    if (!result || result.length === 0) return;

    const newDatasets = result.map((essayScore) => {
      const data = normalizedRadarArray(essayScore);
      const hue = darkMode ? 0 : 200;

      setTotalScore(computeTotalAdjustedScore(essayScore));

      return {
        label: `${essayScore.filename}`,
        data,
        backgroundColor: `hsla(${hue}, 100%, 70%, 0.1)`,
        borderColor: `hsl(${hue}, 100%, 50%)`,
        borderWidth: 1,
        pointBackgroundColor: `hsl(${hue}, 100%, 50%)`,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: `hsl(${hue}, 100%, 50%)`,
      };
    });

    setRadarData((prevData) => ({ ...prevData, datasets: newDatasets }));

    const newTableData = result.map((essayScore) => essayScore.top_k_features || []);
    setTableData(newTableData);
  }, [result, darkMode]);

  const groupMeta = buildGroupMeta(TABLE_GROUPS);

  return (
    <div className='text-sm overflow-hidden flex flex-col'>
      <button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
        <h3 className='font-semibold'>{title}</h3>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      <div className={`${hidden ? "h-0 hidden" : "h-auto block pt-2"} transition-all ease-in-out grid grid-cols-1 md:grid-cols-5 gap-2`}>
        {(!result || result.length === 0) &&
          <div className="text-center p-4">Select essays to compare</div>
        }
        {(result && result.length > 0) &&
          <>
            <div className='col-span-2 bg-white dark:bg-slate-950 rounded-xl relative flex items-center p-2 overflow-hidden justify-center'>
              <div className="absolute top-0 left-0 flex flex-col gap-2 items-center p-3 bg-slate-300 dark:bg-slate-600 rounded-br-xl font-normal">
                <span>{LABELS.total_score[language]}</span>
                <span>
                  <span className="text-2xl font-black">
                    {totalScore}
                  </span>
                  &nbsp; / {TOTAL_MAX_WITH_BONUS}
                </span>
              </div>
              <Radar data={radarData} options={radarOptions} />
            </div>

            <div className='col-span-3 bg-white dark:bg-slate-950 text-sm rounded-xl overflow-hidden'>
              <div>
                <button
                  onClick={() => setTableMode(true)}
                  className={`btn-secondary rounded-b-none border-b-0 ${tableMode ? "table-header" : ""}`}
                >
                  {LABELS.top_k_indices?.[language]}
                </button>
                <button
                  onClick={() => setTableMode(false)}
                  className={`btn-secondary rounded-b-none border-b-0 ${!tableMode ? "table-header" : ""}`}
                >
                  {LABELS.essay_score?.[language]}
                </button>
              </div>

              {tableMode &&
                <div>
                  {tableData.map((features, index) => (
                    <div key={index} className='w-full max-h-[30rem] grid grid-cols-1 gap-2 overflow-auto'>
                      <table className='w-full text-xs'>
                        <thead>
                          <tr className="*:table-header *:rounded-none">
                            <th className='p-1 w-8 text-right sticky top-0'>N.</th>
                            <th className='p-1 sticky top-0 text-left'>{LABELS.feature[language]}</th>
                            <th className='p-1 sticky top-0 text-left'>{LABELS.type[language]}</th>
                            <th className='p-1 sticky top-0 text-left'>{LABELS.Mor[language]}</th>
                            <th className='p-1 sticky top-0 text-left'>{LABELS.description[language]}</th>
                          </tr>
                        </thead>
                        <tbody className="table-contents">
                          {features.map((feature, index) => (
                            <tr key={index} className='group'>
                              <td className='p-1 w-8 text-right'>{index + 1}</td>
                              <td className='p-1 max-w-28 break-words truncate group-hover:text-wrap'>
                                {CohTags[feature]?.alias || feature}
                              </td>
                              <td className="p-1">
                                <div className="flex flex-col">
                                  <span className="text-nowrap">
                                    {feature.includes("Den") ? "어휘 밀도" :
                                      CohTags[feature.split("_")[1]]?.type ||
                                      CohTags[feature]?.type}
                                  </span>
                                  <span className="text-nowrap">
                                    {feature.includes("Den") ? "Density" :
                                      CohTags[feature.split("_")[1]]?.type_eng ||
                                      CohTags[feature]?.type_eng}
                                  </span>
                                </div>
                              </td>
                              <td className="p-1">
                                <div className="flex flex-col">
                                  <span className="text-nowrap">
                                    {MorphTags.find(tag => tag.tag === feature.split("L_")[0])?.desc ||
                                      MorphTags.find(tag => tag.tag === feature.split("CL_")[0])?.desc ||
                                      MorphTags.find(tag => tag.tag === feature.split("FL_")[0])?.desc ||
                                      MorphTags.find(tag => tag.tag === feature.split("_")[0])?.desc}
                                  </span>
                                  <span className="text-nowrap">
                                    {MorphTags.find(tag => tag.tag === feature.split("L_")[0])?.desc_eng ||
                                      MorphTags.find(tag => tag.tag === feature.split("CL_")[0])?.desc_eng ||
                                      MorphTags.find(tag => tag.tag === feature.split("FL_")[0])?.desc_eng ||
                                      MorphTags.find(tag => tag.tag === feature.split("_")[0])?.desc_eng}
                                  </span>
                                </div>
                              </td>
                              <td className="p-1">
                                <div className="flex flex-col">
                                  <span className="text-nowrap">
                                    {feature.includes("CL_Den") & feature !== "CL_Den" ? "실질 형태소 밀도" :
                                      feature.includes("FL_Den") & feature !== "FL_Den" ? "형식 형태소 밀도" :
                                        feature.includes("L_Den") & feature !== "L_Den" ? "어휘 밀도" :
                                          CohTags[feature.split("_")[1]]?.desc ||
                                          CohTags[feature]?.desc}
                                  </span>
                                  <span className="text-nowrap">
                                    {feature.includes("CL_Den") & feature !== "CL_Den" ? "Content Morpheme Density" :
                                      feature.includes("FL_Den") & feature !== "FL_Den" ? "Formal Morpheme Density" :
                                        feature.includes("L_Den") & feature !== "L_Den" ? "Morheme Density" :
                                          CohTags[feature.split("_")[1]]?.desc_eng ||
                                          CohTags[feature]?.desc_eng}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              }

              {!tableMode &&
                <div>
                  {result.map((essayScore, idxTable) => (
                    <div key={idxTable} className='w-full max-h-[30rem] grid grid-cols-1 gap-2 overflow-auto'>
                      <table className='w-full text-xs'>
                        <thead>
                          <tr className="*:table-header *:rounded-none">
                            <th className='p-1 w-8 text-right sticky top-0'>N.</th>
                            <th className='p-1 sticky top-0'>{LABELS.type1?.[language]}</th>
                            <th className='p-1 sticky top-0 text-left'>{LABELS.rubric?.[language]}</th>
                            <th className='p-1 sticky top-0 text-right'>{LABELS.score?.[language]}</th>
                          </tr>
                        </thead>
                        <tbody className="table-contents">
                          {TABLE_KEYS.map((key, index) => {
                            const isGroupStart = groupMeta.some(m => m.start === index);
                            const groupInfo = groupMeta.find(m => m.start === index);
                            const adj = getAdjustedScore(essayScore, key);
                            const isError = adj === "Error";

                            return (
                              <React.Fragment key={key}>
                                <tr className=''>
                                  <td className='p-1 w-8 text-right'>{index + 1}</td>
                                  {isGroupStart &&
                                    <td rowSpan={groupInfo.length} className='p-1 text-center'>
                                      <div className="flex flex-col">
                                        <span>{EssayTags[key]?.type}</span>
                                        <span>{EssayTags[key]?.type_eng}</span>
                                      </div>
                                    </td>
                                  }
                                  <td className='p-1'>
                                    <div className="flex flex-col">
                                      <span>{EssayTags[key]?.desc}</span>
                                      <span>{EssayTags[key]?.desc_eng}</span>
                                    </div>
                                  </td>
                                  <td className='p-2 text-right font-bold'>
                                    {isError ? (
                                      <span className="text-red-500 text-xs italic">평가 불가</span>
                                    ) : (
                                      `${adj} / ${MAX_SCORES[key]}`
                                    )}
                                  </td>
                                </tr>

                                {index === TABLE_KEYS.length - 1 && (
                                  <tr>
                                    <td colSpan={4} className='p-2 text-center text-red-600 font-semibold'>
                                      {isLowTopicRelevance(essayScore)
                                        ? "주제 적합성이 낮아 채점이 제한됩니다. 발문에 적합한 글을 작성하세요."
                                        : "내용(Content)와 표현(Expression) 항목에 각각 기본 점수(default score) +5점 +2점이 부여됨"}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              }
            </div>
          </>
        }
      </div>
    </div>
  );
}

const EvalFormatCompare = ({ result, darkMode }) => {
  const [radarData, setRadarData] = useState(initialRadarData);
  const [tableData, setTableData] = useState([]);
  const hasLowTopicRelevance = Array.isArray(result) && result.some(isLowTopicRelevance);

  const radarOptions = {
    scales: {
      r: {
        angleLines: { display: true },
        grid: {},
        suggestedMin: 0,
        suggestedMax: 1,
        pointLabels: { font: { weight: 'bold', family: 'Noto Sans KR' } },
        ticks: { display: true, stepSize: 0.2 }
      }
    },
    plugins: {
      legend: {
        labels: { font: { weight: 'bold', family: 'Noto Sans KR' } },
      },
    },
    animation: false,
  }

  const { addBatchDownload, clearBatchDownloads } = useBatchDownloads();

  useEffect(() => {
    if (!result || result.length === 0) return;

    const newDatasets = result.map((essayScore, index) => {
      const data = normalizedRadarArray(essayScore);
      const hue = index * 360 / result.length;
      const lightness = darkMode ? 70 : 50;

      return {
        label: `${essayScore.filename}`,
        data,
        backgroundColor: `hsla(${hue}, 100%, ${lightness}%, 0.1)`,
        borderColor: `hsl(${hue}, 100%, ${lightness}%)`,
        borderWidth: 1,
        pointBackgroundColor: `hsl(${hue}, 100%, ${lightness}%)`,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: `hsl(${hue}, 100%, ${lightness}%)`,
      };
    });

    setRadarData((prevData) => ({ ...prevData, datasets: newDatasets }));

    const newTableData = result.map((essayScore) => essayScore.top_k_features || []);
    setTableData(newTableData);
  }, [result, darkMode]);

  const groupMeta = buildGroupMeta(TABLE_GROUPS);

  return (
    <div className='w-full flex text-sm h-auto transition-all ease-in-out overflow-scroll'>
      {(!result || result.length === 0) &&
        <div className="text-center p-4">Select essays to compare</div>
      }
      {(result && result.length > 0) &&
        <div className="w-full flex md:flex-row flex-col gap-2 justify-between max-h-[480px]">
          <div className="flex flex-col gap-2 divide-y-2 p-3 bg-slate-300 dark:bg-slate-600 rounded-xl font-normal">
            <div className="flex justify-between items-center">
              <span className="font-bold">Total Scores</span>
              <button className="btn-secondary p-1" onClick={clearBatchDownloads}>Clear</button>
            </div>
            {result.map((essayScore, index) => (
              <div key={index} className="flex justify-between items-center gap-1">
                <span className="flex flex-col pt-2">
                  <span className="flex items-center gap-2">
                    {index + 1}
                    <span
                      className="rounded-full inline-block w-3 h-3"
                      style={{ backgroundColor: `hsl(${index * 360 / result.length}, 100%, 50%)` }}
                    />
                    <span className="text-nowrap">{essayScore.filename}</span>
                  </span>
                  <span className="font-black">
                    {computeTotalAdjustedScore(essayScore)}&nbsp;/&nbsp;{TOTAL_MAX_WITH_BONUS}
                  </span>
                </span>
                <button className="btn-secondary p-1" onClick={() => addBatchDownload(essayScore._id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center grow items-center aspect-square">
            <Radar data={radarData} options={radarOptions} />
          </div>

          <div className='max-h-[32rem] grid grid-cols-1 gap-2 rounded-xl overflow-clip'>
            <div className='w-full max-h-[32rem] grid grid-cols-1 gap-2'>
              <table className='w-full text-xs'>
                <thead>
                  <tr className="*:table-header *:rounded-none">
                    <th className='p-1 w-8 text-right sticky top-0'>N.</th>
                    <th className='p-1 sticky top-0'>Type</th>
                    <th className='p-1 sticky top-0 text-left'>Rubric</th>
                    <th className='p-1 sticky top-0 text-right'>Score</th>
                  </tr>
                </thead>
                <tbody className="table-contents">
                  {TABLE_KEYS.map((key, index) => {
                    const isGroupStart = groupMeta.some(m => m.start === index);
                    const groupInfo = groupMeta.find(m => m.start === index);

                    // 하이라이트 기준(최대값)
                    const maxInCol = Math.max(...result.map(ess => {
                      const v = getAdjustedScore(ess, key);
                      return v === "Error" ? -Infinity : toNumber(v);
                    }));

                    return (
                      <React.Fragment key={key}>
                        <tr className=''>
                          <td className='p-1 w-8 text-right'>{index + 1}</td>
                          {isGroupStart &&
                            <td rowSpan={groupInfo.length} className='p-1 text-center'>
                              <div className="flex flex-col">
                                <span>{EssayTags[key]?.type}</span>
                                <span>{EssayTags[key]?.type_eng}</span>
                              </div>
                            </td>
                          }
                          <td className='p-1'>
                            <div className="flex flex-col">
                              <span>{EssayTags[key]?.desc}</span>
                              <span>{EssayTags[key]?.desc_eng}</span>
                            </div>
                          </td>
                          <td className='p-1'>
                            <div className="flex flex-row justify-between gap-1">
                              {result.map((essayScore, idx) => {
                                const adj = getAdjustedScore(essayScore, key);
                                const adjNum = adj === "Error" ? -Infinity : toNumber(adj);
                                const maxAdjRef = MAX_SCORES[key];
                                const isBest = adjNum !== -Infinity && adjNum === maxInCol;

                                return (
                                  <span
                                    key={idx}
                                    className={`p-2 ${isBest ? "font-bold" : ""}`}
                                    style={{ backgroundColor: `hsla(${idx * 360 / result.length}, 100%, 50%, 20%)` }}
                                    title={adj === "Error" ? "N/A" : `${adj} / ${maxAdjRef}`}
                                  >
                                    {adj === "Error" ? "N/A" : adj}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>

                        {index === TABLE_KEYS.length - 1 && (
                          <tr>
                            <td colSpan={4} className='p-2 text-center text-red-600 font-semibold'>
                              {hasLowTopicRelevance
                                ? "발문에 적합한 글을 작성하세요"
                                : "내용(Content)와 표현(Expression) 항목에 각각 기본 점수(default score) +5점 +2점이 부여됨"}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  );
}

export { EvalFormat, EvalFormatCompare };
