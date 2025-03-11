import { Chart as ChartJS, Filler, Legend, LineElement, PointElement, RadialLinearScale, Tooltip } from 'chart.js';
import React, { useEffect, useState } from "react";
import { Radar } from 'react-chartjs-2';
import { CohTags, EssayTags, MorphTags } from "../../Tags";
import { useBatchDownloads } from "../../contexts/BatchDownloadContext"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const initialRadarData = {
	labels: ["Grammar", "Vocabulary", "Sentence", "In-Paragraph", "Inter-Paragraph", "Consistency", "Length", "Clarity", "Originality", "Descriptions"],
	datasets: [],
};


const EvalFormat = ({ result, title, darkMode }) => {
	const [hidden, setHidden] = useState(true);
	const [radarData, setRadarData] = useState(initialRadarData);
	const [tableData, setTableData] = useState([]);
	const [tableMode, setTableMode] = useState(true);
	const [totalScore, setTotalScore] = useState(0);

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
				suggestedMax: 3,
				pointLabels: {
					color: darkMode ? '#f8fafc' : '#313e50',
					fontSize: 14,
					font: {
						weight: 'bold',
						family: 'Noto Sans KR',
					},
				},
				ticks: {
					display: false,
					stepSize: 1,
				}
			}
		},
		plugins: {
			legend: {
				labels: {
					color: darkMode ? '#f8fafc' : '#313e50',
					fontSize: 14,
					font: {
						weight: 'bold',
						family: 'Noto Sans KR',
					},
				},
			},
		},
		animation: false,
	};

	useEffect(() => {
		if (result) {
			if (result.length === 0) return;
			const newDatasets = result.map((essayScore, index) => {
				const results = [
					essayScore.grammar,
					essayScore.vocabulary,
					essayScore.sentence_expression,
					essayScore.intra_paragraph_structure,
					essayScore.inter_paragraph_structure,
					essayScore.structural_consistency,
					essayScore.length,
					essayScore.topic_clarity,
					essayScore.originality,
					// essayScore.prompt_comprehension,
					essayScore.narrative,
				];

				const hue = darkMode ? 0 : 200;

				setTotalScore(results.reduce((acc, cur) => acc + cur, 0));

				return {
					label: `${essayScore.filename}`,
					data: results,
					backgroundColor: `hsla(${hue}, 100%, 70%, 0.1)`,
					borderColor: `hsl(${hue}, 100%, 50%)`,
					borderWidth: 1,
					pointBackgroundColor: `hsl(${hue}, 100%, 50%)`,
					pointBorderColor: '#fff',
					pointHoverBackgroundColor: '#fff',
					pointHoverBorderColor: `hsl(${hue}, 100%, 50%)`,
				};
			});

			setRadarData((prevData) => ({
				...prevData,
				datasets: newDatasets,
			}));

			const newTableData = result.map((essayScore) => {
				return essayScore.top_k_features || [];
			});

			setTableData(newTableData);
		}
	}, [result]);

	return (
		<div className='text-sm overflow-hidden flex flex-col'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='font-semibold'>{title}</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0 hidden" : "h-auto block pt-2"} transition-all ease-in-out grid grid-cols-1 md:grid-cols-5 gap-2`}>
				{result.length === 0 &&
					<div className="text-center p-4">Select essays to compare</div>
				}
				{result.length > 0 &&
					<>
						<div className='col-span-2 bg-white dark:bg-slate-950 rounded-xl relative flex items-center p-2 overflow-hidden justify-center'>
							<div className="absolute top-0 left-0 flex flex-col gap-2 items-center p-3 bg-slate-300 dark:bg-slate-600 rounded-br-xl font-normal">
								<span>Total Score</span>
								<span>
									<span className="text-2xl font-black">
										{totalScore}
									</span>
									&nbsp; / 30
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
									Top-K Indices
								</button>
								<button
									onClick={() => setTableMode(false)}
									className={`btn-secondary rounded-b-none border-b-0 ${tableMode ? "" : "table-header"}`}
								>
									Essay Score
								</button>
							</div>
							{tableMode &&
								<div>
									{tableData.map((features, index) => (
										<div key={index} className='w-full max-h-[30rem] grid grid-cols-1 gap-2 overflow-auto'>
											<table className='w-full text-xs'>
												<thead className=''>
													<tr className="*:table-header *:rounded-none">
														<th className='p-1 w-8 text-right sticky top-0'>N.</th>
														<th className='p-1 sticky top-0 text-left'>Feature</th>
														<th className='p-1 sticky top-0 text-left'>Type</th>
														<th className='p-1 sticky top-0 text-left'>Morpheme</th>
														<th className='p-1 sticky top-0 text-left'>Description</th>
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
									{result.map((essayScore, index) => (
										<div key={index} className='w-full max-h-[30rem] grid grid-cols-1 gap-2 overflow-auto'>
											<table className='w-full text-xs'>
												<thead className=''>
													<tr className="*:table-header *:rounded-none">
														<th className='p-1 w-8 text-right sticky top-0'>N.</th>
														<th className='p-1 sticky top-0'>Type</th>
														<th className='p-1 sticky top-0 text-left'>Rubric</th>
														<th className='p-1 sticky top-0 text-right'>Score</th>
													</tr>
												</thead>
												<tbody className="table-contents">
													{Object.keys(essayScore).filter(key => key !== "top_k_features" && key !== "filename" && key !== "prompt_comprehension").map((key, index) => (
														<tr key={index} className=''>
															<td className='p-1 w-8 text-right'>{index + 1}</td>
															{index === 0 &&
																<td rowSpan={3} className='p-1 text-center'>
																	<div className="flex flex-col">
																		<span>{EssayTags[key].type}</span>
																		<span>{EssayTags[key].type_eng}</span>
																	</div>
																</td>
															}
															{(index === 3 || index === 7) &&
																<td rowSpan={4} className='p-1 text-center'>
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
															<td className='p-2 text-right'>{essayScore[key]} / 3</td>
														</tr>
													))}
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
				angleLines: {
					display: true,
				},
				grid: {
				},
				suggestedMin: 0,
				suggestedMax: 3,
				pointLabels: {
					fontSize: 14,
					font: {
						weight: 'bold',
						family: 'Noto Sans KR',
					},
				},
				ticks: {
					display: false,
					stepSize: 1,
				}
			}
		},
		plugins: {
			legend: {
				labels: {
					fontSize: 14,
					font: {
						weight: 'bold',
						family: 'Noto Sans KR',
					},
				},
			},
		},
		animation: false,
	}
	const { batchDownloads, addBatchDownload, clearBatchDownloads, handleBatchDownload, handleBatchDelete } = useBatchDownloads();

	useEffect(() => {
		console.log(result);
		if (result) {
			if (result.length === 0) return;
			const newDatasets = result.map((essayScore, index) => {
				const results = [
					essayScore.grammar,
					essayScore.vocabulary,
					essayScore.sentence_expression,
					essayScore.intra_paragraph_structure,
					essayScore.inter_paragraph_structure,
					essayScore.structural_consistency,
					essayScore.length,
					essayScore.topic_clarity,
					essayScore.originality,
					// essayScore.prompt_comprehension,
					essayScore.narrative,
				];

				const hue = index * 360 / result.length;
				const lightness = darkMode ? 70 : 50;

				return {
					label: `${essayScore.filename}`,
					data: results,
					backgroundColor: `hsla(${hue}, 100%, ${lightness}%, 0.1)`,
					borderColor: `hsl(${hue}, 100%, ${lightness}%)`,
					borderWidth: 1,
					pointBackgroundColor: `hsl(${hue}, 100%, ${lightness}%)`,
					pointBorderColor: '#fff',
					pointHoverBackgroundColor: '#fff',
					pointHoverBorderColor: `hsl(${hue}, 100%, ${lightness}%)`,
				};
			});

			setRadarData((prevData) => ({
				...prevData,
				datasets: newDatasets,
			}));

			const newTableData = result.map((essayScore) => {
				return essayScore.top_k_features || [];
			});

			setTableData(newTableData);
		}
	}, [result]);

	return (
		<div className='w-full flex text-sm h-auto transition-all ease-in-out overflow-scroll'>
			{result.length === 0 &&
				<div className="text-center p-4">Select essays to compare</div>
			}
			{result.length > 0 &&
				<div className="w-full flex md:flex-row flex-col gap-2 justify-between max-h-[480px]">
					<div className="flex flex-col gap-2 divide-y-2 p-3 bg-slate-300 dark:bg-slate-600 rounded-xl font-normal">
						<div className="flex justify-between items-center">
							<span className="font-bold">Total Scores</span>
							<button
								className="btn-secondary p-1"
								onClick={clearBatchDownloads}
							>
								Clear
							</button>
						</div>
						{result.map((essayScore, index) => (
							<div className="flex justify-between items-center gap-1">
								<span key={index}
									className="flex flex-col pt-2"
								>
									<span className="flex items-center gap-2">
										{index + 1}
										<span
											className="rounded-full inline-block w-3 h-3"
											style={{ backgroundColor: `hsl(${index * 360 / result.length}, 100%, 50%)` }}
										>
										</span>
										<span className="text-nowrap">
											{essayScore.filename}
										</span>
									</span>
									<span
										className="font-black"
									>
										{Object.values(essayScore).reduce((acc, cur) => acc + (typeof cur === 'number' ? cur : 0), 0)}
										&nbsp;/&nbsp;30
									</span>
								</span>
								<button
									className="btn-secondary p-1"
									onClick={() => addBatchDownload(essayScore._id)}
								>
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

					{/* <Line data={{ labels: [], datasets: [] }} /> */}

					<div className='max-h-[32rem] grid grid-cols-1 gap-2 rounded-xl overflow-clip'>
						<div className='w-full max-h-[32rem] grid grid-cols-1 gap-2'>
							<table className='w-full text-xs'>
								<thead className=''>
									<tr className="*:table-header *:rounded-none">
										<th className='p-1 w-8 text-right sticky top-0'>N.</th>
										<th className='p-1 sticky top-0'>Type</th>
										<th className='p-1 sticky top-0 text-left'>Rubric</th>
										<th className='p-1 sticky top-0 text-right'>Score</th>
									</tr>
								</thead>
								<tbody className="table-contents">
									{Object.keys(result[0]).filter(key => key !== "top_k_features" && key !== "_id" && key !== "filename" && key !== "prompt_comprehension").map((key, index) => (
										<tr key={index} className=''>
											<td className='p-1 w-8 text-right'>{index + 1}</td>
											{index === 0 &&
												<td rowSpan={3} className='p-1 text-center'>
													<div className="flex flex-col">
														<span>{EssayTags[key]?.type}</span>
														<span>{EssayTags[key]?.type_eng}</span>
													</div>
												</td>
											}
											{(index === 3 || index === 7) &&
												<td rowSpan={4} className='p-1 text-center'>
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
													{result.map((essayScore, index) => (
														<span
															key={index}
															className={`p-2 ${Math.max(
																...result.map(essay => essay[key])
															) === essayScore[key] ? "font-bold" : ""}`}
															style={{ backgroundColor: `hsla(${index * 360 / result.length}, 100%, 50%, 20%)` }}
														>
															{essayScore[key]}
														</span>
													))}
												</div>
											</td>
										</tr>
									))}
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
