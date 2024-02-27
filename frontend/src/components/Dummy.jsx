import React from 'react';
import { Link } from 'react-router-dom';


const Dummy = () => {
	return (
		<div className='fade-in'>
			<h2 className="text-3xl font-bold py-2">Input text or upload file to start</h2>
			<div className={`h-32`}>
				Or view previous results
				<div className={`h-32`}>
					<ul className='list-disc list-inside pl-4'>
						<li><Link to="/morpheme" className={`hover:text-slate-500`}>형태소</Link></li>
						<li><Link to="/cohesion" className={`hover:text-slate-500`}>자질</Link></li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default Dummy;
