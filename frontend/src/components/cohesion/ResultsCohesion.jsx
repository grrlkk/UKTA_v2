import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';

import ResultHeader from '../ResultHeader';
import { ResultsList, ResultsNumeric } from './AnalysisFormat';


const ResultsCoh = () => {
	const [cohesionResult, setCohesionResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(0);

	const fetchData = async () => {
		try {
			const response = await fetch('https://ukta.inha.ac.kr/api/korcat/cohesion');
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
			let position = element.getBoundingClientRect().top;
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
	}

	const handleSelectFile = (index) => {
		return () => {
			selectedFile === index ? setSelectedFile(-1) : setSelectedFile(index);
		}
	}

	const handleDelete = async (index) => {
		const id = cohesionResult[index]._id;

		try {
			const response = await fetch(`https://ukta.inha.ac.kr/api/korcat/cohesion/${id}`, {
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
			<h2 className="text-2xl font-bold py-2">자질 분석 결과</h2>

			<Pagination componentArray=
				{cohesionResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
					<div
						id={"coh_" + index}
						key={index}
						className={`
							p-4 h-fit rounded-3xl overflow-auto w-full shadow relative transition-all 
							${selectedFile === index ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}
						`}
					>
						<div className='grid grid-cols-1'>
							<div className='grid grid-cols-1 gap-8' onClick={handleSelectFile(index)}>
								<ResultHeader title={item.filename} content={item.contents} trunc={selectedFile !== index} date={item.upload_date} procTime={item.process_time} />
							</div>

							<div key={index} className={`${selectedFile === index ? 'mt-4' : 'h-0 overflow-hidden'} transition-all ease-in-out font-semibold`}>
								<hr className='mb-6' />

								<div className='flex flex-col gap-4'>
									<ResultsNumeric result={item.results.ttr} title={"TTR"} />
									<ResultsNumeric result={item.results.similarity} title={"Similarity"} />
									<ResultsNumeric result={item.results.adjacency} title={"Adjacency"} />
									<ResultsNumeric result={item.results.basic_count} title={"Basic Count"} />
									<ResultsList result={item.results.basic_list} title={"Basic List"} />
								</div>
							</div>
						</div>

						<div className={`absolute top-4 right-4 flex gap-2 text-sm pl-4`}>
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
				))} />
		</motion.div>
	);
};

export default ResultsCoh;
