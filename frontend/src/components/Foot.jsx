import React from 'react';
import { Link } from 'react-router-dom';


const Foot = ({ darkMode, setDarkMode }) => {
	return (
		<footer
			className="mt-64 pt-32 pb-16 text-slate-500 text-xs bg-slate-50 dark:bg-slate-950"
		>
			<div className="max-w-6xl px-4 sm:px-6 lg:px-8 mx-auto flex flex-col lg:items-end lg:flex-row justify-between gap-16">
				<div className='flex flex-col justify-between lg:justify-start items-center lg:items-start gap-4 w-full'>
					<div className='divide-x-2 dark:divide-slate-700 *:px-2 flex justify-center'>
						<Link to='/cohesion' className='hover:font-bold first:pl-0'>자질 분석</Link>
						<Link to='/morpheme' className='hover:font-bold'>형태소 분석</Link>
						<Link to='/tagging' className='hover:font-bold'>품사 태깅표</Link>
					</div>

					{/* <button
						className="btn-primary rounded-full flex gap-1 p-1 items-center"
						onClick={() => setDarkMode((prev) => !prev)}
					>
						<div className={`px-2 rounded-full ${darkMode ? "bg-slate-300 hover:bg-slate-500 text-slate-800" : ""}`}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
							</svg>
						</div>
						<div className={`px-2 rounded-full ${!darkMode ? "bg-slate-300 hover:bg-slate-500 text-slate-800" : ""}`}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
							</svg>
						</div>
					</button> */}

					<a href='https://sites.google.com/view/kdd-lab/' className='hover:text-slate-500 hover:underline font-bold'>
						2024 KDD LAB, INHA Univ.
					</a>
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
