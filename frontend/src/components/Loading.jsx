import React from 'react';
import { Link } from 'react-router-dom';


const Loading = () => {
	return (
		<div className="mb-32">
			<h2 className="text-3xl font-bold py-2 flex gap-2 align-middle animate-pulse">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[32px] h-[32px] animate-spin">
					<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
				</svg>
				분석중...
			</h2>
			<div className={``}>
				이전 분석 결과 보기
				<div className={``}>
					<ul className='list-disc list-inside p-2'>
						<li><Link to="/morpheme" className={`hover:text-slate-500`}>형태소</Link></li>
						<li><Link to="/cohesion" className={`hover:text-slate-500`}>자질</Link></li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default Loading;
