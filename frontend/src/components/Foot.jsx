import React from 'react';
import { Link } from 'react-router-dom';


const Foot = () => {
	const logoText = `
██╗  ██╗██████╗ ██████╗ 
██║ ██╔╝██╔══██╗██╔══██╗
█████╔╝ ██║  ██║██║  ██║
██╔═██╗ ██║  ██║██║  ██║
██║  ██╗██████╔╝██████╔╝
╚═╝  ╚═╝╚═════╝ ╚═════╝ 
██╗      █████╗ ██████╗ 
██║     ██╔══██╗██╔══██╗
██║     ███████║██████╔╝
██║     ██╔══██║██╔══██╗
███████╗██║  ██║██████╔╝
╚══════╝╚═╝  ╚═╝╚═════╝ 
`

	return (
		<footer className="bg-slate-50 mt-32 py-4 text-[#677389]">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-end">
				<pre className='leading-none text-[0.5rem]'>
					{logoText}
				</pre>

				<div>
					<Link to='/tagging' className='text-xs hover:underline'>품사 태깅표</Link> 
					<p className='text-xs'>2024 KDD Lab @ INHA Univ.</p>
				</div>
			</div>
		</footer>
	);
};

export default Foot;
