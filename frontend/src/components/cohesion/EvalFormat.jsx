import React, { useState } from "react";
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, Ticks } from 'chart.js';

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

const EvalFormat = ({ result, title }) => {
	const [hidden, setHidden] = useState(false);

	return (
		<div className='rounded-xl text-sm overflow-hidden flex flex-col'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='text-lg font-semibold'>{title}</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0" : "h-auto pt-2"} transition-all ease-in-out grid grid-cols-1 md:grid-cols-2 gap-2 *:p-2`}>
				<div className='bg-[#020617] rounded-xl flex justify-center'>
					<Radar data={radarData} options={radarOptions} />
				</div>
				<div className='text-sm bg-[#020617] rounded-xl'>
					Attention
				</div>
			</div>
		</div>
	);
}

export default EvalFormat;