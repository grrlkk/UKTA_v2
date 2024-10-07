import React, { useEffect, useState } from "react";
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, Ticks } from 'chart.js';

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
	labels: ['문법', '단어', '문장 표현', '문단 내 구조의 적절성', '문단 간 구조의 적절성', '구조의 일관성', '분량', '주제의 명료함', '참신성', '프롬프트 독해력', '서술력'],
	datasets: [],
};

const EvalFormat = ({ result, title }) => {
	const [hidden, setHidden] = useState(false);
	const [radarData, setRadarData] = useState(initialRadarData);

	useEffect(() => {
		console.log(result);
		if (result) {
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
		}
	}, [result]);

	return (
		<div className='rounded-xl text-sm overflow-hidden flex flex-col'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h2 className="text-2xl font-bold py-2">{title}</h2>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0" : "h-auto pt-2"} transition-all ease-in-out grid grid-cols-1 md:grid-cols-5 gap-2 *:p-2`}>
				<div className='bg-[#020617] rounded-xl flex justify-center col-span-3'>
					<Radar data={radarData} options={radarOptions} />
				</div>
				<div className='text-sm bg-[#020617] rounded-xl col-span-2'>
					<table className="w-full *:text-center">
						<thead className="*:h-12">
							<tr>
								<th>Rank</th>
								<th>Metric</th>
							</tr>
						</thead>
						<tbody className="*:h-12">
							<tr>
								<td>1</td>
								<td>NN_Cnt</td>
							</tr>
							<tr>
								<td>2</td>
								<td>VV_MATTR</td>
							</tr>
							<tr>
								<td>3</td>
								<td>NN_CTTR</td>
							</tr>
							<tr>
								<td>4</td>
								<td>NL_RTTR</td>
							</tr>
							<tr>
								<td>5</td>
								<td>CL_VOCDD</td>
							</tr>
							<tr>
								<td>6</td>
								<td>NN_RTTR</td>
							</tr>
							<tr>
								<td>7</td>
								<td>NL_NDW</td>
							</tr>
							<tr>
								<td>8</td>
								<td>NNP_MTLD</td>
							</tr>
							<tr>
								<td>9</td>
								<td>NL_MTLD</td>
							</tr>
							<tr>
								<td>10</td>
								<td>NNP_RTTR</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

export default EvalFormat;