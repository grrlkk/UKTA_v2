import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

import OriginalText from '../OriginalText';
import Pagination from '../Pagination';
import { ResultsList, ResultsNumeric, MorphemeFormat } from './AnalysisFormat';
import EvalFormat from './EvalFormat';


const ResultCoh = ({ resultId, darkMode }) => {
	const [item, setItem] = useState({});
	const fetchData = async () => {
		try {
			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/cohesion/${resultId}`);
			const data = await response.json();
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
					<EvalFormat
						darkMode={darkMode}
						result={[{
							...item.results.essay_score,
							filename: item.filename,
						}]}
						title={"Writing Evaluation"}
					/>

					<MorphemeFormat results={item.results.morpheme} title={"Morpheme Analysis"} />

					<ResultsNumeric result={item.results.basic_count} title={"Morpheme Count"} />
					<ResultsList result={item.results.basic_list} title={"Morpheme Lists"} />

					<ResultsNumeric result={item.results.basic_density} title={"Morpheme Density"} />
					<ResultsNumeric result={item.results.basic_level} title={"Morpheme/Word Length"} />

					<ResultsNumeric result={item.results.ttr} title={"Lexical Diversity (TTR)"} />
					<ResultsNumeric result={item.results.NDW} title={"Lexical Diversity (NDW)"} />

					<ResultsNumeric result={item.results.adjacency} title={"Lexical Diversity (Adjacency)"} />
					<ResultsNumeric result={item.results.similarity} title={"Semantic Cohesion"} />
				</>
			)}
			{!item.results && <p className='animate-pulse'>Loading...</p>}
		</div>
	)
}

const ResultsCoh = ({ darkMode }) => {
	const [cohesionResult, setCohesionResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(0);
	const [selectedEssay, setSelectedEssay] = useState([]);

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
		var element = document.getElementById('coh_' + selectedFile);
		if (element) {
			let position = element.getBoundingClientRect().top;
			window.scrollTo({ top: position + window.scrollY - 100, behavior: 'smooth' });
		}
	}, [selectedFile]);

	const handleSelectEssay = (item) => {
		const essayScore = {
			...item.results.essay_score,
			filename: item.filename,
		};
		const isAlreadySelected = selectedEssay.some(
			(selected) => JSON.stringify(selected) === JSON.stringify(essayScore)
		);

		if (isAlreadySelected) {
			setSelectedEssay(selectedEssay.filter(
				(selected) => JSON.stringify(selected) !== JSON.stringify(essayScore)
			));
		} else {
			setSelectedEssay([...selectedEssay, essayScore]);
		}
	};

	const handleFileDownload = (item) => {
		const data = JSON.stringify(item);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${item._id}_cohesion.json`;
		link.click();
		link.remove();
	}

	const handleSelectFile = (index) => {
		return () => {
			setSelectedFile(index);
		}
	}

	const handleDelete = async (index) => {
		const id = cohesionResult[index]._id;

		try {
			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/cohesion/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id })
			});
		} catch (error) {
			console.error(error);
		} finally {
			setCohesionResult([]);
			await new Promise(resolve => setTimeout(resolve, 500));
			await fetchData();

			if (cohesionResult.length > 0) {
				setSelectedFile(0);
			}
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
			<h2 className="text-2xl font-bold py-2">Cohesion Analysis Results</h2>

			<Pagination componentArray=
				{cohesionResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
					<div
						id={"coh_" + index}
						key={index}
						onClick={handleSelectFile(index)}
						className={`
							p-4 h-fit rounded-3xl overflow-auto w-full shadow relative transition-all 
							${selectedFile === index ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}
						`}
					>
						<div className='grid grid-cols-1'>
							<h3 className='pb-4 text-lg font-bold truncate'>{index + 1}. {item.filename}</h3>
							<OriginalText content={item.contents} trunc={selectedFile !== index} date={item.upload_date} procTime={item.process_time} />

							<div key={index} className={`flex flex-col gap-4 ${selectedFile === index ? 'mt-4' : 'h-0 overflow-hidden'} transition-all ease-in-out`}>
								<hr className='' />

								{selectedFile === index && <ResultCoh resultId={item._id} darkMode={darkMode} />}
							</div>
						</div>

						<div className={`absolute top-4 right-4 flex gap-2 text-sm pl-4`}>
							{/* <button className={`grow sm:grow-0 btn-primary flex flex-nowrap gap-1`} onClick={() => handleSelectEssay(item)}>
								Compare
							</button> */}
							<button className={`grow sm:grow-0 btn-primary flex flex-nowrap gap-1`} onClick={() => handleFileDownload(item)}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
								</svg>
								json
							</button>
							<button className={`grow sm:grow-0 p-2 btn-red group`} onClick={() => handleDelete(index)}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-all ease-in-out">
									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
				))} setSelectedFile={setSelectedFile} />
		</motion.div>
	);
};

export default ResultsCoh;
