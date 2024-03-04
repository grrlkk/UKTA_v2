import React from 'react';
import { Link } from 'react-router-dom';


const Dummy = () => {
	return (
		<div className="mb-32 fade-in">
			<h2 className="text-3xl font-bold py-2">
				한국어 분석
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

export default Dummy;
