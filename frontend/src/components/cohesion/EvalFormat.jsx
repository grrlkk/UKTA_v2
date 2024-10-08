import React, { useEffect, useState } from "react";
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, Ticks } from 'chart.js';
import { CohTags } from "../Tags";
import { steps } from "framer-motion";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);


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
			suggestedMax: 3,
			pointLabels: {
				color: '#f8fafc',
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
				color: '#f8fafc',
			},
		},
	}
};

const initialRadarData = {
	labels: ["Grammar", "Vocabulary", "Sentence Expression", "Intra-Paragraph Structure", "Inter-Paragraph Structure", "Structural Consistency", "Length", "Topic Clarity", "Originality", "Prompt Comprehension", "Narrative"],
	datasets: [],
};

const EvalFormat = ({ result, title }) => {
	const [hidden, setHidden] = useState(true);
	const [radarData, setRadarData] = useState(initialRadarData);
	const [tableData, setTableData] = useState([]);

	useEffect(() => {
		if (result) {
			if (result.length === 0) return;
			setHidden(false);
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
					essayScore.prompt_comprehension,
					essayScore.narrative,
				];

				const hue = (index * 40) % 360;

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

			<div className={`${hidden ? "h-0" : "h-auto pt-2"} transition-all ease-in-out grid grid-cols-1 md:grid-cols-5 gap-2 *:p-2`}>
				{result.length === 0 &&
					<div className="text-center p-4">Select essays to compare</div>
				}
				{result.length > 0 &&
					<>
						<div className='bg-slate-950 max-h-[30rem] rounded-xl flex justify-center col-span-3'>
							<Radar data={radarData} options={radarOptions} />
						</div>
						<div className=' bg-slate-950 text-sm rounded-xl col-span-2'>
							{tableData.map((features, index) => (
								<div key={index} className='w-full grid grid-cols-1 gap-2'>
									<h3 className='font-bold'>Top Features</h3>
									<table className='w-full overflow-hidden text-xs'>
										<thead className='table-header'>
											<tr>
												<th className='p-2 w-10 text-right'>N.</th>
												<th className='p-2'>Feature</th>
												<th className='p-2'>Description</th>
											</tr>
										</thead>
										<tbody className="table-contents">
											{features.map((feature, index) => (
												<tr key={index} className=''>
													<td className='p-2 w-10 text-right'>{index + 1}</td>
													<td className='p-2 max-w-20 truncate'>{feature}</td>
													<td className='p-2'>{CohTags[feature].target} {CohTags[feature].desc}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							))}
						</div>
					</>
				}
			</div>
		</div>
	);
}

export default EvalFormat;