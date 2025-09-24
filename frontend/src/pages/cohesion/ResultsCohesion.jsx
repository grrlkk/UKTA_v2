import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Comparison from '../../components/Comparison';
import OriginalText from '../../components/OriginalText';
import Pagination from '../../components/Pagination';
import { useBatchDownloads } from '../../contexts/BatchDownloadContext';
import { CorrectionFormat, GradeFormat, MorphemeFormat, ResultsList, ResultsListNgram, ResultsNumeric } from './AnalysisFormat';
import { EvalFormat } from './EvalFormat';
import { LABELS } from "../../labels";
import { useLanguage } from '../../contexts/LanguageContext';

const ResultCoh = ({ resultId, darkMode }) => {
  const [item, setItem] = useState({});
  const { language } = useLanguage();

  const fetchData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/cohesion/${resultId}`);
      const data = await response.json();
      console.log("백엔드 디버깅 결과:", data.result);
      setItem(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resultId]);

  return (
    <div className='flex flex-col gap-4 font-semibold'>
      {item.results && (
        <>
          <MorphemeFormat results={item.results.morpheme} title={LABELS.morpheme_analysis[language]} />
          {item.results.correction?.revisedSentences && (
            <CorrectionFormat results={item.results.correction} title={LABELS.correction[language]} />
          )}
          <GradeFormat results={item.results.voc_grades} title={LABELS.vocabulary_grades[language]} />

          <hr />

          <h3 className='text-lg font-bold'>{LABELS.Basic[language]}</h3>

          <ResultsNumeric result={item.results.basic_count} title={LABELS.morpheme_count[language]} />
          <ResultsList result={item.results.basic_list} title={LABELS.morpheme_list[language]} />

          <ResultsNumeric result={item.results.basic_density} title={LABELS.morpheme_density[language]} />
          <ResultsNumeric result={item.results.basic_level} title={LABELS.morpheme_len[language]} />

          <hr />

          <h3 className='text-lg font-bold'>{LABELS.morpheme_level[language]}</h3>

          <ResultsNumeric result={item.results.ttr} title={LABELS.lexical_TTR[language]} />
          <ResultsNumeric result={item.results.NDW} title={LABELS.lexical_NDW[language]} />

          <hr />

          <h3 className='text-lg font-bold'>{LABELS.sentence_level[language]}</h3>

          <ResultsNumeric result={item.results.sentenceLvl} title={LABELS.sentence_complexity[language]} />
          <ResultsNumeric result={item.results.sentenceLvlRep} title={LABELS.sentence_repetition[language]} />
          {item.results.sentenceLvlRep_list &&
            <ResultsListNgram result={item.results.sentenceLvlRep_list} title={LABELS.repetition_list[language]} />
          }

          <hr />

          <h3 className='text-lg font-bold'>{LABELS.Cohesion[language]}</h3>

          <ResultsNumeric result={item.results.adjacency} title={LABELS.adjacency_cohesion[language]} />
          <ResultsNumeric result={item.results.similarity} title={LABELS.semantic_similarity[language]} />

          <hr />

          <h3 className='text-lg font-bold'>{LABELS.text_level[language]}</h3>

          <ResultsNumeric result={item.results.readability} title={LABELS.readability_scores[language]} />

          <h3 className='text-lg font-bold'>{LABELS.writing_evaluation[language]}</h3>

          {(item.results.essay_score !== "error") &&
            <EvalFormat
              darkMode={darkMode}
              result={[{
                ...item.results.essay_score,
                filename: item.filename,
              }]}
              title={LABELS.writing_evaluation[language]}
            />}
        </>
      )}
      {!item.results && <p className='animate-pulse'>Loading...</p>}
    </div>
  )
}

const ResultsCoh = ({ darkMode }) => {
  const [cohesionResult, setCohesionResult] = useState([]);
  const [selectedFile, setSelectedFile] = useState(-1);
  const { batchDownloads, addBatchDownload, clearBatchDownloads, handleBatchDownload, handleBatchDelete, compare, setCompare } = useBatchDownloads();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // 피드백 페이지로 JSON(원문 포함) 넘기기
  const handleGoFeedback = (item) => {
    try {
      const payload = {
        _id: item._id,
        filename: item.filename,
        contents: item.contents,          // ✅ 피드백 원문
        upload_date: item.upload_date,
        process_time: item.process_time,
        results: item.results ?? null,    // 이미 로드돼 있으면 동봉
      };
      sessionStorage.setItem('feedback_payload', JSON.stringify(payload)); // 새로고침 대비
      navigate('/feedback', { state: { payload } });
    } catch (e) {
      console.error('handleGoFeedback error:', e);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/cohesion`);
      const data = await response.json();
      setCohesionResult(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const element = document.getElementById('coh_' + selectedFile);
    if (element) {
      const position = element.getBoundingClientRect().top;
      window.scrollTo({ top: position + window.scrollY - 100, behavior: 'smooth' });
    }
  }, [selectedFile]);

  const handleFileDownload = (item) => {
    const data = JSON.stringify(item);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item._id}_cohesion.json`;
    link.click();
    link.remove();
  };

  const handleSelectFile = (index) => {
    return () => {
      index === -1 ? setSelectedFile(-1) : setSelectedFile(index);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.1 }}
      className='grid grid-cols-1 gap-4'
    >
      <h2 className="text-2xl font-bold py-2">
        {LABELS.analysis_results[language]}
      </h2>

      <div className='
        w-fit justify-self-end px-4 
        flex flex-row gap-2 items-center justify-end text-sm
        sticky top-16 z-50 h-16 -mb-4'
      >
        <span className='mr-2'>
          {batchDownloads.length}{LABELS.file_chooser[language]}
        </span>
        <div className='flex flex-row divide-x divide-slate-400'>
          <button
            className="btn-primary rounded-r-none grow-0 flex flex-nowrap items-center gap-1"
            onClick={handleBatchDownload}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
            </svg>
            <span className='sm:block hidden'>
              {LABELS.download[language]}
            </span>
          </button>
          <button
            onClick={() => setCompare(!compare)}
            className={`
              btn-primary rounded-none flex flex-nowrap items-center gap-1
              ${compare ? '' : ''}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <span className='sm:block hidden'>
              {compare ? `Close ${LABELS.Compare[language]}` : LABELS.Compare[language]}
            </span>
          </button>
          <button
            className="btn-primary rounded-l-none grow-0 flex flex-nowrap items-center gap-1 group"
            onClick={clearBatchDownloads}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-all ease-in-out group-hover:rotate-90">
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            <span className='sm:block hidden'>
              {LABELS.clear[language]}
            </span>
          </button>
        </div>
        <button
          className="btn-red grow-0 flex flex-nowrap items-center gap-1 group"
          onClick={handleBatchDelete}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-all ease-in-out group-hover:rotate-90">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          {LABELS.delete[language]}
        </button>
      </div>

      <Comparison />

      <Pagination
        componentArray={
          cohesionResult
            .sort((a, b) => -a._id.localeCompare(b._id))
            .map((item, index) => (
              <div
                id={"coh_" + index}
                key={index}
                className={`
                  p-4 h-fit rounded-3xl overflow-auto w-full shadow relative transition-all 
                  ${selectedFile === index ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}
                `}
              >
                <div
                  className='grid grid-cols-1'
                  onClick={handleSelectFile(index)}
                >
                  <h3 className='pb-4 text-lg font-bold truncate'>{index + 1}. {item.filename}</h3>
                  <OriginalText content={item.contents} trunc={selectedFile !== index} date={item.upload_date} procTime={item.process_time} />

                  <div key={index} className={`flex flex-col gap-4 ${selectedFile === index ? 'mt-4' : 'h-0 overflow-hidden'} transition-all ease-in-out`}>
                    <hr className='' />
                    {selectedFile === index ?
                      <ResultCoh resultId={item._id} darkMode={darkMode} /> :
                      <div>Loading</div>
                    }
                  </div>
                </div>

                {/* 우상단 액션바 */}
                <div className={`absolute top-4 right-4 flex gap-2 text-sm pl-4`}>
                  {index === selectedFile &&
                    <button className={`grow sm:grow-0 p-2 btn-primary group`} onClick={handleSelectFile(-1)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-all ease-in-out">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                      </svg>
                    </button>
                  }

                  {/* ✅ 피드백 버튼 (payload 싣고 /feedback으로 이동) */}
                  <button
					className="btn-primary !px-2 py-2 flex items-center justify-center gap-1"
					onClick={(e) => { e.stopPropagation(); handleGoFeedback(item); }}
					title={LABELS?.feedback?.[language] ?? 'Feedback'}
					>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
							strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
						<path strokeLinecap="round" strokeLinejoin="round"
						d="m16.862 4.487 1.687 1.687m-2.748-.562-8.4 8.4a4.5 4.5 0 0 0-1.17 2.137l-.347 1.388 1.388-.347a4.5 4.5 0 0 0 2.137-1.17l8.4-8.4M12 20.25h9" />
					</svg>
					<span className="hidden md:inline">{LABELS?.feedback?.[language] ?? 'Feedback'}</span>
					</button>

                  <div className='flex flex-nowrap divide-x divide-slate-400'>
                    <button className={`grow sm:grow-0 btn-primary rounded-r-none flex flex-nowrap gap-1`} onClick={(e) => { e.stopPropagation(); handleFileDownload(item); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
                      </svg>
                      json
                    </button>
                    <button className={`grow sm:grow-0 btn-primary rounded-l-none flex flex-nowrap gap-1`} onClick={(e) => { e.stopPropagation(); addBatchDownload(item._id); }}>
                      <input
                        type='checkbox'
                        className='accent-slate-600'
                        checked={batchDownloads.some((file) => file._id === item._id)}
                        onChange={() => { }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))
        }
        setSelectedFile={setSelectedFile}
      />
    </motion.div>
  );
};

export default ResultsCoh;



// import { motion } from 'framer-motion';
// import React, { useEffect, useState } from 'react';

// import Comparison from '../../components/Comparison';
// import OriginalText from '../../components/OriginalText';
// import Pagination from '../../components/Pagination';
// import { useBatchDownloads } from '../../contexts/BatchDownloadContext';
// import { CorrectionFormat, GradeFormat, MorphemeFormat, ResultsList, ResultsListNgram, ResultsNumeric } from './AnalysisFormat';
// import { EvalFormat } from './EvalFormat';
// import { LABELS } from "../../labels";
// import { useLanguage } from '../../contexts/LanguageContext'; // ⬅️ language 가져오기



// const ResultCoh = ({ resultId, darkMode }) => {
// 	const [item, setItem] = useState({});
// 	const { language } = useLanguage();

// 	const fetchData = async () => {
// 		try {
// 			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/cohesion/${resultId}`);
// 			const data = await response.json();
// 			console.log("백엔드 디버깅 결과:", data.result);  // ✅ 이게 콘솔에 찍힘
// 			setItem(data);
// 		} catch (error) {
// 			console.error(error);
// 		}
// 	};

// 	useEffect(() => {
// 		fetchData();
// 	}, [resultId]);

// 	return (
// 		<div className='flex flex-col gap-4 font-semibold'>
// 			{item.results && (
// 				<>
// 					<MorphemeFormat results={item.results.morpheme} title={LABELS.morpheme_analysis[language]} />
// 					{item.results.correction?.revisedSentences && (
// 						<CorrectionFormat results={item.results.correction} title={LABELS.correction[language]} />
// 					)}
// 					<GradeFormat results={item.results.voc_grades} title={LABELS.vocabulary_grades[language]} />

// 					<hr />

// 					<h3 className='text-lg font-bold'>{LABELS.Basic[language]}</h3>

// 					<ResultsNumeric result={item.results.basic_count} title={LABELS.morpheme_count[language]} />
// 					<ResultsList result={item.results.basic_list} title={LABELS.morpheme_list[language]} />

// 					<ResultsNumeric result={item.results.basic_density} title={LABELS.morpheme_density[language]} />
// 					<ResultsNumeric result={item.results.basic_level} title={LABELS.morpheme_len[language]} />

// 					<hr />

// 					<h3 className='text-lg font-bold'>{LABELS.morpheme_level[language]}</h3>


// 					<ResultsNumeric result={item.results.ttr} title={LABELS.lexical_TTR[language]} />
// 					<ResultsNumeric result={item.results.NDW} title={LABELS.lexical_NDW[language]} />

// 					<hr />

// 					<h3 className='text-lg font-bold'>{LABELS.sentence_level[language]}</h3>

// 					<ResultsNumeric result={item.results.sentenceLvl} title={LABELS.sentence_complexity[language]} />
// 					<ResultsNumeric result={item.results.sentenceLvlRep} title={LABELS.sentence_repetition[language]} />
// 					{item.results.sentenceLvlRep_list &&
// 						<ResultsListNgram result={item.results.sentenceLvlRep_list} title={LABELS.repetition_list[language]} />
// 					}

// 					<hr />

// 					<h3 className='text-lg font-bold'>{LABELS.Cohesion[language]}</h3>

// 					<ResultsNumeric result={item.results.adjacency} title={LABELS.adjacency_cohesion[language]} />
// 					<ResultsNumeric result={item.results.similarity} title={LABELS.semantic_similarity[language]} />

// 					<hr />

// 					<h3 className='text-lg font-bold'>{LABELS.text_level[language]}</h3>

// 					<ResultsNumeric result={item.results.readability} title={LABELS.readability_scores[language]} />

// 					<h3 className='text-lg font-bold'>{LABELS.writing_evaluation[language]}</h3>

// 					{(item.results.essay_score !== "error") &&
// 						<EvalFormat
// 							darkMode={darkMode}
// 							result={[{
// 								...item.results.essay_score,
// 								filename: item.filename,
// 							}]}
// 							title={LABELS.writing_evaluation[language]}
// 						/>}
// 				</>
// 			)}
// 			{!item.results && <p className='animate-pulse'>Loading...</p>}
// 		</div>
// 	)
// }

// const ResultsCoh = ({ darkMode }) => {
// 	const [cohesionResult, setCohesionResult] = useState([]);
// 	const [selectedFile, setSelectedFile] = useState(-1);
// 	const { batchDownloads, addBatchDownload, clearBatchDownloads, handleBatchDownload, handleBatchDelete, compare, setCompare } = useBatchDownloads();
// 	const { language } = useLanguage();
	
// 	const fetchData = async () => {
// 		try {
// 			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/cohesion`);
// 			const data = await response.json();
// 			setCohesionResult(data);
// 		} catch (error) {
// 			console.error(error);
// 		}
// 	};

// 	useEffect(() => {
// 		fetchData();
// 	}, []);

// 	useEffect(() => {
// 		var element = document.getElementById('coh_' + selectedFile);
// 		if (element) {
// 			let position = element.getBoundingClientRect().top;
// 			window.scrollTo({ top: position + window.scrollY - 100, behavior: 'smooth' });
// 		}
// 	}, [selectedFile]);

// 	const handleFileDownload = (item) => {
// 		const data = JSON.stringify(item);
// 		const blob = new Blob([data], { type: 'application/json' });
// 		const url = URL.createObjectURL(blob);
// 		const link = document.createElement('a');
// 		link.href = url;
// 		link.download = `${item._id}_cohesion.json`;
// 		link.click();
// 		link.remove();
// 	}

// 	const handleSelectFile = (index) => {
// 		return () => {
// 			index === -1 ? setSelectedFile(-1) : setSelectedFile(index);
// 		}
// 	}


// 	return (
// 		<motion.div
// 			initial={{ opacity: 0, x: 100 }}
// 			animate={{ opacity: 1, x: 0 }}
// 			exit={{ opacity: 0, x: -100 }}
// 			transition={{ duration: 0.1 }}
// 			className='grid grid-cols-1 gap-4'
// 		>
// 			<h2 className="text-2xl font-bold py-2">
// 			{LABELS.analysis_results[language]}
// 			</h2>

// 			<div className='
// 				w-fit justify-self-end px-4 
// 				flex flex-row gap-2 items-center justify-end text-sm
// 				sticky top-16 z-50 h-16 -mb-4'
// 			>
// 				<span className='mr-2'>
//   					{batchDownloads.length}{LABELS.file_chooser[language]}
// 				</span>
// 				<div className='flex flex-row divide-x divide-slate-400'>
// 					<button
// 						className="btn-primary rounded-r-none grow-0 flex flex-nowrap items-center gap-1"
// 						onClick={handleBatchDownload}
// 					>
// 						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
// 							<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
// 						</svg>
// 						<span className='sm:block hidden'>
// 						{LABELS.download[language]}
// 						</span>
// 					</button>
// 					<button
// 						onClick={() => setCompare(!compare)}
// 						className={`
// 							btn-primary rounded-none flex flex-nowrap items-center gap-1
// 							${compare ? '' : ''}
// 						`}
// 					>
// 						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
// 							<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
// 						</svg>
// 						<span className='sm:block hidden'>
//   					{compare ? `Close ${LABELS.Compare[language]}` : LABELS.Compare[language]}
// 					</span>
// 					</button>
// 					<button
// 						className="btn-primary rounded-l-none grow-0 flex flex-nowrap items-center gap-1 group"
// 						onClick={clearBatchDownloads}
// 					>
// 						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-all ease-in-out group-hover:rotate-90">
// 							<path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
// 						</svg>
// 						<span className='sm:block hidden'>
// 						{LABELS.clear[language]}
// 						</span>
// 					</button>
// 				</div>
// 				<button
// 					className="btn-red grow-0 flex flex-nowrap items-center gap-1 group"
// 					onClick={handleBatchDelete}
// 				>
// 					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-all ease-in-out group-hover:rotate-90">
// 						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
// 					</svg>
// 					{LABELS.delete[language]}
// 				</button>
// 			</div>

// 			<Comparison />

// 			<Pagination componentArray=
// 				{cohesionResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
// 					<div
// 						id={"coh_" + index}
// 						key={index}
// 						className={`
// 							p-4 h-fit rounded-3xl overflow-auto w-full shadow relative transition-all 
// 							${selectedFile === index ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}
// 						`}
// 					>
// 						<div
// 							className='grid grid-cols-1'
// 							onClick={handleSelectFile(index)}
// 						>
// 							<h3 className='pb-4 text-lg font-bold truncate'>{index + 1}. {item.filename}</h3>
// 							<OriginalText content={item.contents} trunc={selectedFile !== index} date={item.upload_date} procTime={item.process_time} />

// 							<div key={index} className={`flex flex-col gap-4 ${selectedFile === index ? 'mt-4' : 'h-0 overflow-hidden'} transition-all ease-in-out`}>
// 								<hr className='' />

// 								{selectedFile === index ?
// 									<ResultCoh resultId={item._id} darkMode={darkMode} /> :
// 									<div>Loading</div>
// 								}
// 							</div>
// 						</div>

// 						<div className={`absolute top-4 right-4 flex gap-2 text-sm pl-4`}>
// 							{index === selectedFile &&
// 								<button className={`grow sm:grow-0 p-2 btn-primary group`} onClick={handleSelectFile(-1)}>
// 									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-all ease-in-out">
// 										<path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
// 									</svg>
// 								</button>
// 							}
// 							<div className='flex flex-nowrap divide-x divide-slate-400'>
// 								<button className={`grow sm:grow-0 btn-primary rounded-r-none flex flex-nowrap gap-1`} onClick={() => handleFileDownload(item)}>
// 									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
// 										<path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
// 									</svg>
// 									json
// 								</button>
// 								<button className={`grow sm:grow-0 btn-primary rounded-l-none flex flex-nowrap gap-1`} onClick={() => addBatchDownload(item._id)}>
// 									<input
// 										type='checkbox'
// 										className='accent-slate-600'
// 										checked={batchDownloads.some((file) => file._id === item._id)}
// 										onChange={() => { }}
// 									></input>
// 								</button>
// 							</div>
// 						</div>
// 					</div>
// 				))} setSelectedFile={setSelectedFile} />
// 		</motion.div>
// 	);
// };

// export default ResultsCoh;

