import React from 'react';
import { Link } from 'react-router-dom';


const Foot = () => {
	return (
		<footer className="bg-slate-50 mt-64 pt-24 py-4 text-[#677389]">
			<div className="max-w-6xl px-4 sm:px-6 lg:px-8 mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-8">
				<div className='flex flex-col gap-4'>
					<Link to='/tagging' className='text-xs hover:font-bold underline'>품사 태깅표</Link>

					<div className='flex flex-col'>
						<p className='text-xs'>2024 KDD Lab</p>
						<p className='text-xs'>INHA Univ.</p>
					</div>
				</div>

				<div className='flex flex-row gap-4 grayscale'>
					<img src={`${process.env.PUBLIC_URL}/kdd_logo_p.png`} alt="logo" className="h-8" />
					<img src={`${process.env.PUBLIC_URL}/inha_logo_p.png`} alt="logo" className="h-8" />
				</div>
			</div>
		</footer>
	);
};

export default Foot;
