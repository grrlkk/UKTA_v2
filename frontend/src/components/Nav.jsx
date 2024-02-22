import React from 'react';
import { Link } from 'react-router-dom';


const Nav = ({ currentPage }) => {
	return (
		<nav className="bg-slate-50 fixed w-full bg-opacity-50 backdrop-blur z-50">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-12">
				<Link to='/' className="font-black">
					U-TKA
				</Link>

				<div className="whitespace-nowrap flex gap-2 items-center text-sm">
					<Link to="/morpheme" className={`${currentPage === "/morpheme" ? "text-slate-600" : "text-slate-300"} hover:text-slate-500 px-3`}>형태소</Link>
					<Link to="/cohesion" className={`${currentPage === "/cohesion" ? "text-slate-600" : "text-slate-300"} hover:text-slate-500 px-3`}>자질</Link>
				</div>
			</div>
		</nav>
	);
};

export default Nav;
