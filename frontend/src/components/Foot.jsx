import React from 'react';
import { Link } from 'react-router-dom';


const Foot = () => {
	return (
		<footer
			className="mt-96 pt-32 pb-16 text-slate-500 text-xs bg-slate-50 dark:bg-slate-950"
		>
			<div className="max-w-6xl px-4 sm:px-6 lg:px-8 mx-auto flex flex-col lg:items-end lg:flex-row justify-between gap-16">
				<div className='flex flex-col justify-between lg:justify-start items-center lg:items-start gap-4 w-full'>
					<div className='divide-x-2 dark:divide-slate-700 *:px-2 flex justify-center'>
						<Link to='/analysis' className='hover:underling first:pl-0'>Analysis</Link>
						<Link to='/tagging' className='hover:underline'>Tag Information</Link>
					</div>
					<div className='flex flex-col'>
						<div className='flex flex-row gap-1'>
							Developed by
							<a href='https://sites.google.com/view/kdd-lab/' className='hover:text-slate-500 hover:underline font-bold'>
								2024-2025 KDD LAB, INHA University
							</a>
						</div>
						<div className='flex flex-row gap-1'>
							Official GitHub Repository
							<a href='https://github.com/ttytu/KorCAT-web' className='hover:text-slate-500 hover:underline font-bold'>
								UKTA-web
							</a>
						</div>
						<div className='flex flex-row gap-1'>
							Morpheme & Grammar Analysis Powered by
							<a href='https://bareun.ai/' className='hover:text-slate-500 hover:underline font-bold'>
								Bareun
							</a>
						</div>
					</div>
				</div>

				<div className='flex flex-row gap-4 grayscale w-full justify-center lg:justify-end dark:invert'>
					<img src={`${process.env.PUBLIC_URL}/kdd_logo_p.png`} alt="logo" className="h-8" />
					<img src={`${process.env.PUBLIC_URL}/inha_logo_p.png`} alt="logo" className="h-8" />
				</div>
			</div>
		</footer>
	);
};

export default Foot;
