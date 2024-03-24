import React from 'react';
import { Link } from 'react-router-dom';


const Foot = () => {
	return (
		<footer
			className="mt-64 pt-24 py-4 text-[#677389] text-xs bg-gradient-to-b from-slate-50 to-white"
		>
			<div className="max-w-6xl px-4 sm:px-6 lg:px-8 mx-auto flex flex-col lg:items-end lg:flex-row justify-between gap-16">
				<div className='flex flex-col justify-between lg:justify-start items-center lg:items-start gap-4 w-full'>
					<div className='divide-x-2 divide-slate-300 *:px-2 flex justify-center'>
						<Link to='/morpheme' className='hover:font-bold first:pl-0'>형태소 분석</Link>
						<Link to='/cohesion' className='hover:font-bold'>자질 분석</Link>
						<Link to='/tagging' className='hover:font-bold'>품사 태깅표</Link>
					</div>

					<a href='https://sites.google.com/view/kdd-lab/' className='hover:text-slate-600 hover:underline font-bold'>
						2024 KDD LAB, INHA Univ.
					</a>
				</div>

				<div className='flex flex-row gap-4 grayscale w-full justify-center lg:justify-end'>
					<img src={`${process.env.PUBLIC_URL}/kdd_logo_p.png`} alt="logo" className="h-8" />
					<img src={`${process.env.PUBLIC_URL}/inha_logo_p.png`} alt="logo" className="h-8" />
				</div>
			</div>
		</footer>
	);
};

export default Foot;
