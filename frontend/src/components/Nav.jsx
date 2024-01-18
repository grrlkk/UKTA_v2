import React from 'react';


const Nav = ({ currentPage }) => {
	return (
		<nav className="bg-slate-50 fixed w-full bg-opacity-50 backdrop-blur z-50">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-12">
				<a href='/' className="font-black">
					KorCAT
				</a>

				<div className="ml-10 space-x-4 whitespace-nowrap items-center text-sm">
					<a href="/morpheme" className={`${currentPage === "/morpheme" ? "text-slate-600" : "text-slate-300"} hover:text-slate-500 px-3 py-2`}>형태소</a>
					<a href="/text" className={`${currentPage === "/text" ? "text-slate-600" : "text-slate-300"} hover:text-slate-500 px-3 py-2`}>자질</a>
				</div>
			</div>
		</nav>
	);
};

export default Nav;
