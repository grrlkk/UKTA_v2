import { Chart as ChartJS, Filler, Legend, LineElement, PointElement, RadialLinearScale, Tooltip } from 'chart.js';
import React, { useEffect, useState } from "react";
import { Radar } from 'react-chartjs-2';
import { CohTags, EssayTags, MorphTags } from "../../Tags";
import { useBatchDownloads } from "../../contexts/BatchDownloadContext"
import { LABELS } from "../../labels";
import { useLanguage } from '../../contexts/LanguageContext';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// 레이더 축: 내용(3) → 조직(2) → 표현(3)
const initialRadarData = {
  labels: [
    "주장의 명료성",           // topic_clarity
    "근거의 적절성",       // originality
    "사고의 창의성",         // narrative
    "문단 내 구조",      // intra_paragraph_structure
    "문단 간 구조",   // inter_paragraph_structure
    "문법",           // grammar
    "어휘",        // vocabulary
    "문장 표현",          // sentence_expression
  ],
  datasets: [],
};

// const initialRadarData = {
//   labels: [
//     "Clarity",           // topic_clarity
//     "Originality",       // originality
//     "Narrative",         // narrative
//     "In-Paragraph",      // intra_paragraph_structure
//     "Inter-Paragraph",   // inter_paragraph_structure
//     "Grammar",           // grammar
//     "Vocabulary",        // vocabulary
//     "Sentence",          // sentence_expression
//   ],
//   datasets: [],
// };

// ▶ 새 점수 규칙(원점수 상한)
const MAX_SCORES = {
  grammar: 6,
  vocabulary: 6,
  sentence_expression: 6,
  intra_paragraph_structure: 15,
  inter_paragraph_structure: 15,
  structural_consistency: 15, // 제외
  length: 15,                 // 제외
  topic_clarity: 15,
  originality: 15,            // 변경: 창의성 총점 15점
  narrative: 15,
  Topic_relevance: 3
};

// 총점에서 제외할 키(표에도 숨김)
const EXCLUDED_KEYS = ["structural_consistency", "length"];

// 표/총점 반영 키(이미지 순서)
const GROUPS = [
  { keys: ["topic_clarity", "narrative", "originality"] },                    // 내용 (이제 15 + 15 + 15 + 기본5 = 50)
  { keys: ["intra_paragraph_structure", "inter_paragraph_structure"] },       // 조직 (30 = 15*2)
  { keys: ["grammar", "vocabulary", "sentence_expression"] },
  { keys: ["Topic_relevance"] } // 9번째 행으로 배치                 // 표현 (20 = 6*3 + 기본2)
];
const ORDERED_KEYS = GROUPS.flatMap(g => g.keys);

// 가중 변환(원점수 → 가중점수)
const adjustScore = (key, value) => {
  const v = typeof value === "number" ? value : 0;
  if (key === "Topic_relevance") return v; // 일단 가중치 없이 원점수 사용
  switch (key) {
    case "grammar":
    case "vocabulary":
    case "sentence_expression":
      return v * 2; // 표현: 2배(6→12)
    case "intra_paragraph_structure":
    case "inter_paragraph_structure":
    case "structural_consistency":
    case "length":
    case "topic_clarity":
    case "narrative":
	case "originality":
      return v * 5; // 내용/조직: 5배(15→75)
    default:
      return v;
  }
};

// 가중 최대값(표/정규화용 분모)
const weightedMax = (key) => MAX_SCORES[key] ?? 0;

// 최대 점수 총합(제외 항목 제외, 가중치 반영 전 상한 합)
const TOTAL_MAX_INCLUDED = ORDERED_KEYS.reduce((acc, k) => acc + (MAX_SCORES[k] || 0), 0); // 93 (창의성 15 반영)

// 기본점수: 내용 +5, 표현 +2
const TOTAL_BONUS = 7;
const TOTAL_MAX_WITH_BONUS = TOTAL_MAX_INCLUDED + TOTAL_BONUS; // 100

// 레이더는 0~1 정규화(가중점수 / 가중최대)
const normalizedRadarArray = (essayScore) => ([
  adjustScore("topic_clarity", essayScore.topic_clarity)                        / weightedMax("topic_clarity"),
  adjustScore("originality",   essayScore.originality)                          / weightedMax("originality"),
  adjustScore("narrative",     essayScore.narrative)                            / weightedMax("narrative"),
  adjustScore("intra_paragraph_structure", essayScore.intra_paragraph_structure)/ weightedMax("intra_paragraph_structure"),
  adjustScore("inter_paragraph_structure",  essayScore.inter_paragraph_structure)/ weightedMax("inter_paragraph_structure"),
  adjustScore("grammar",       essayScore.grammar)                              / weightedMax("grammar"),
  adjustScore("vocabulary",    essayScore.vocabulary)                           / weightedMax("vocabulary"),
  adjustScore("sentence_expression", essayScore.sentence_expression)            / weightedMax("sentence_expression"),
]);

// 총점: 제외 키 빼고 가중합 + 보너스
const computeTotalAdjustedScore = (essayScore) =>
  ORDERED_KEYS.reduce((a, k) => a + adjustScore(k, essayScore[k]), 0) + TOTAL_BONUS;

const buildGroupMeta = () => {
  const meta = [];
  let start = 0;
  for (const g of GROUPS) {
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
        suggestedMax: 1,     // 0~1 정규화
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

  const groupMeta = buildGroupMeta();

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
                          {ORDERED_KEYS.map((key, index) => {
                            const groupMeta = buildGroupMeta();
                            const isGroupStart = groupMeta.some(m => m.start === index);
                            const groupInfo = groupMeta.find(m => m.start === index);
                            return (
                              <React.Fragment key={key}>
                                <tr className=''>
                                  <td className='p-1 w-8 text-right'>{index + 1}</td>
                                  {isGroupStart &&
                                    <td rowSpan={groupInfo.length} className='p-1 text-center'>
                                      <div className="flex flex-col">
                                        <span>{EssayTags[key].type}</span>
                                        <span>{EssayTags[key].type_eng}</span>
                                      </div>
                                    </td>
                                  }
                                  <td className='p-1'>
                                    <div className="flex flex-col">
                                      <span>{EssayTags[key].desc}</span>
                                      <span>{EssayTags[key].desc_eng}</span>
                                    </div>
                                  </td>
                                  <td className='p-2 text-right font-bold'>
                                      {essayScore[key] === "Error" ? (
                                          <span className="text-red-500 text-xs italic">평가 불가</span>
                                      ) : (
                                          /* 기존 점수 출력 로직 */
                                          `${adjustScore(key, essayScore[key])} / ${MAX_SCORES[key]}`
                                      )}
                                  </td>
                                </tr>
                                {index === 8 && (
                                  <tr>
                                    <td colSpan={4} className='p-2 text-center text-red-600 font-semibold'>
                                      내용(Content)와 표현(Expression) 항목에 각각 기본 점수(default score) +5점 +2점이 부여됨
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
  const radarOptions = {
    scales: {
      r: {
        angleLines: { display: true },
        grid: {},
        suggestedMin: 0,
        suggestedMax: 1,       // 0~1 정규화
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

  const groupMeta = buildGroupMeta();

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
                  {ORDERED_KEYS.map((key, index) => {
                    const isGroupStart = groupMeta.some(m => m.start === index);
                    const groupInfo = groupMeta.find(m => m.start === index);
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
                              const adj = adjustScore(key, essayScore[key]);   // 표시는 가중 점수
                              const maxAdjRef = MAX_SCORES[key];               // 분모는 원만점(6, 15, 창의성 15)
                              const maxInCol = Math.max(...result.map(ess => adjustScore(key, ess[key]))); // 하이라이트 기준은 가중
                              return (
                                <span
                                  key={idx}
                                  className={`p-2 ${maxInCol === adj ? "font-bold" : ""}`}
                                  style={{ backgroundColor: `hsla(${idx * 360 / result.length}, 100%, 50%, 20%)` }}
                                  title={`${adj} / ${maxAdjRef}`}
                                >
                                  {essayScore[key] === "Error" ? "N/A" : adj}
                                </span>
                              );
                            })}
                            </div>
                          </td>
                        </tr>
                        {index === 8 && (
                          <tr>
                            <td colSpan={4} className='p-2 text-center text-red-600 font-semibold'>
                              내용(Content)와 표현(Expression) 항목에 각각 기본 점수(default score) +5점 +2점이 부여됨
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
