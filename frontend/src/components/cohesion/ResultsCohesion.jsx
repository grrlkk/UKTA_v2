import { color, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, Ticks } from 'chart.js';

import OriginalText from '../OriginalText';
import Pagination from '../Pagination';
import { ResultsList, ResultsNumeric, MorphemeFormat } from './AnalysisFormat';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);


const radarData = {
	labels: ['문법', '단어', '문장 표현', '문단 내 구조의 적절성', '문단 간 구조의 적절성', '구조의 일관성', '분량', '주제의 명료함', '참신성', '프롬프트 독해력', '서술력'],
	datasets: [
		{
			label: 'Analysis Results',
			data: [
				79, 90, 20, 40, 60, 60, 45, 34, 23, 90, 89
			],
			backgroundColor: 'rgba(34, 202, 236, 0.2)',
			borderColor: 'rgba(34, 202, 236, 1)',
			borderWidth: 1,
			pointBackgroundColor: 'rgba(34, 202, 236, 1)',
			pointBorderColor: '#fff',
			pointHoverBackgroundColor: '#fff',
			pointHoverBorderColor: 'rgba(34, 202, 236, 1)',
		},
	],
};

const radarOptions = {
	scales: {
		r: {
			angleLines: {
				display: true,
				color: '#313e50',
			},
			grid: {
				color: '#313e50',
			},
			suggestedMin: 0,
			suggestedMax: 100,
			pointLabels: {
				color: '#f8fafc',
			},
			ticks: {
				display: false,
			}
		}
	},
	animations: {
		tension: {
			duration: 1000,
			easing: 'linear',
			from: 0,
			to: 0.1,
			loop: true
		}
	},
	plugins: {
		legend: {
			labels: {
				color: '#f8fafc',
			},
		},
	}
};

const ResultsCoh = () => {
	const [cohesionResult, setCohesionResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(0);

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
							<h3 onClick={handleSelectFile(index)} className='pb-4 text-lg font-bold truncate'>{index + 1}. {item.filename}</h3>
							<OriginalText content={item.contents} trunc={selectedFile !== index} date={item.upload_date} procTime={item.process_time} />

							<div key={index} className={`flex flex-col gap-4 ${selectedFile === index ? 'mt-4' : 'h-0 overflow-hidden'} transition-all ease-in-out`}>
								<hr className='' />

								<div className='flex flex-col md:flex-row md:gap-4 items-center justify-around '>
									<div className='grow pr-1 bg-[#020617] rounded-xl'>
										<Radar data={radarData} options={radarOptions} />
									</div>
									<div className='text-sm grow pl-1 bg-[#020617] rounded-xl'>
										<table className='w-full'>
											<thead>
												<tr>
													<th>Index</th>
													<th>Label</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td>1</td>
													<td>문법</td>
												</tr>
												<tr>
													<td>2</td>
													<td>단어</td>
												</tr>
												<tr>
													<td>3</td>
													<td>문장 표현</td>
												</tr>
												<tr>
													<td>4</td>
													<td>문단 내 구조의 적절성</td>
												</tr>
												<tr>
													<td>5</td>
													<td>문단 간 구조의 적절성</td>
												</tr>
												<tr>
													<td>6</td>
													<td>구조의 일관성</td>
												</tr>
												<tr>
													<td>7</td>
													<td>분량</td>
												</tr>
												<tr>
													<td>8</td>
													<td>주제의 명료함</td>
												</tr>
												<tr>
													<td>9</td>
													<td>참신성</td>
												</tr>
												<tr>
													<td>10</td>
													<td>프롬프트 독해력</td>
												</tr>
												<tr>
													<td>11</td>
													<td>서술력</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>

								<div className='flex flex-col gap-4 font-semibold'>
									<MorphemeFormat result={item.results.morpheme.sentences} title={"Morpheme Analysis"} />

									<ResultsNumeric result={item.results.basic_count} title={"Morpheme Count"} />
									<ResultsNumeric result={item.results.basic_density} title={"Morpheme Density"} />
									<ResultsNumeric result={item.results.basic_level} title={"Morpheme Level"} />
									<ResultsList result={item.results.basic_list} title={"Morpheme Lists"} />

									<ResultsNumeric result={item.results.ttr} title={"Lexical Richness (TTR)"} />
									<ResultsNumeric result={item.results.NDW} title={"Lexical Richness (NDW)"} />

									{/* <ResultsNumeric result={item.results.adjacency} title={"Adjacency"} /> */}
									<ResultsNumeric result={item.results.similarity} title={"Semantic Cohesion"} />
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
				))} setSelectedFile={setSelectedFile} />
		</motion.div>
	);
};

export default ResultsCoh;
