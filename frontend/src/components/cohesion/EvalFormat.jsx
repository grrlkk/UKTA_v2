import React, { useEffect, useState } from "react";
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { CohTags, MorphTags, EssayTags } from "../Tags";


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
					fontSize: 12,
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
				return essayScore.top_k_features;
			});

			setTableData(newTableData);
		}
	}, [result]);

	return (
		<div className='text-sm overflow-hidden flex flex-col'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='text-lg font-semibold'>{title}</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0 hidden" : "h-auto block pt-2"} transition-all ease-in-out grid grid-cols-1 md:grid-cols-2 gap-2`}>
				{result.length === 0 &&
					<div className="text-center p-4">Select essays to compare</div>
				}
				{result.length > 0 &&
					<>
						<div className='bg-slate-200 dark:bg-slate-950 rounded-xl aspect-square relative flex p-2 overflow-hidden'>
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
						<div className='bg-slate-200 dark:bg-slate-950 text-sm rounded-xl overflow-hidden'>
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
										<div key={index} className='w-full max-h-[30rem] grid grid-cols-1 gap-2 overflow-y-scroll'>
											<table className='w-full text-xs'>
												<thead className=''>
													<tr className="*:table-header *:rounded-none">
														<th className='p-2 w-8 text-right sticky top-0'>N.</th>
														<th className='p-2 sticky top-0 text-left'>Feature</th>
														<th className='p-2 sticky top-0 text-left'>Type</th>
														<th className='p-2 sticky top-0 text-left'>Description</th>
													</tr>
												</thead>
												<tbody className="table-contents">
													{features.map((feature, index) => (
														<tr key={index} className='group'>
															<td className='p-2 w-8 text-right'>{index + 1}</td>
															<td className='p-2 max-w-24 break-words truncate group-hover:text-wrap'>{feature}</td>
															<td className="p-2">
																<div className="flex flex-col">
																	<span>
																		{CohTags[feature.split("_")[1]]?.type ||
																			CohTags[feature.match(/CL_Den/)]?.type ||
																			CohTags[feature.match(/FL_Den/)]?.type ||
																			CohTags[feature]?.type}
																	</span>
																</div>
															</td>
															<td className="p-2">
																<div className="flex flex-col">
																	<div className="flex gap-1">
																		<span>
																			{MorphTags.find(tag => tag.tag === feature.split("_")[0])?.desc ||
																				MorphTags.find(tag => tag.tag === feature.split("L_")[0])?.desc ||
																				MorphTags.find(tag => tag.tag === feature.split("CL_")[0])?.desc ||
																				MorphTags.find(tag => tag.tag === feature.split("FL_")[0])?.desc}
																		</span>
																		<span>
																			{CohTags[feature.match(/CL_Den/)]?.desc ||
																				CohTags[feature.match(/FL_Den/)]?.desc ||
																				CohTags[feature.split("_")[1]]?.desc ||
																				CohTags[feature]?.desc}
																		</span>
																	</div>
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
										<div key={index} className='w-full max-h-[30rem] grid grid-cols-1 gap-2 overflow-y-scroll'>
											<table className='w-full text-xs'>
												<thead className=''>
													<tr className="*:table-header *:rounded-none">
														<th className='p-2 w-8 text-right sticky top-0'>N.</th>
														<th className='p-2 sticky top-0'>Type</th>
														<th className='p-2 sticky top-0 text-left'>Rubric</th>
														<th className='p-2 w-10 sticky top-0 text-right'>Score</th>
													</tr>
												</thead>
												<tbody className="table-contents">
													{Object.keys(essayScore).filter(key => key !== "top_k_features" && key !== "filename" && key !== "prompt_comprehension").map((key, index) => (
														<tr key={index} className=''>
															<td className='p-2 w-8 text-right'>{index + 1}</td>
															{index === 0 &&
																<td rowSpan={3} className='p-2 max-w-20 text-center'>
																	<div className="flex flex-col">
																		<span>{EssayTags[key].type}</span>
																	</div>
																</td>
															}
															{(index === 3 || index === 7) &&
																<td rowSpan={4} className='p-2 max-w-20 text-center'>
																	<div className="flex flex-col">
																		<span>{EssayTags[key].type}</span>
																	</div>
																</td>
															}
															<td className='p-2'>
																<div className="flex gap-1">
																	<span>{EssayTags[key].desc}</span>
																</div>
															</td>
															<td className='p-2 w-10 text-right'>{essayScore[key]} / 3</td>
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

export default EvalFormat;