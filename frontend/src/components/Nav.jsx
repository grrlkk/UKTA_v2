import React from 'react';


const Nav = () => {
	return (
		<nav className="bg-slate-50 fixed w-full">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center">
						<a href='#' className="flex-shrink-0 font-black">
							KorCAT
						</a>
						<div className="hidden md:block">
							<div className="ml-10 flex items-baseline space-x-4">
								<a href="#" className="text-slate-300 hover:text-slate-500 px-3 py-2">형태소</a>
								<a href="#" className="text-slate-300 hover:text-slate-500 px-3 py-2">자질</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Nav;
