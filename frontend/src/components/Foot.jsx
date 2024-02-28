import React from 'react';


const Foot = () => {
	const logoText = `
██╗  ██╗██████╗ ██████╗     ██╗      █████╗ ██████╗ 
██║ ██╔╝██╔══██╗██╔══██╗    ██║     ██╔══██╗██╔══██╗
█████╔╝ ██║  ██║██║  ██║    ██║     ███████║██████╔╝
██╔═██╗ ██║  ██║██║  ██║    ██║     ██╔══██║██╔══██╗
██║  ██╗██████╔╝██████╔╝    ███████╗██║  ██║██████╔╝
╚═╝  ╚═╝╚═════╝ ╚═════╝     ╚══════╝╚═╝  ╚═╝╚═════╝ 
`

	return (
		<footer className="bg-slate-50 mt-32 py-4 text-[#677389]">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-end">
				<pre className='leading-none'>
					{logoText}
				</pre>

				<p>KDD Lab @ INHA Univ.</p>
			</div>
		</footer>
	);
};

export default Foot;
