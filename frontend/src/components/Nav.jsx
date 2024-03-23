import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


const Nav = ({ currentPage }) => {
	const [scrollDown, setScrollDown] = useState(0);
	useEffect(() => {
		const handleScroll = () => {
			setScrollDown(window.scrollY);
		};

		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [scrollDown]);

	return (
		<nav className="bg-slate-50 fixed w-full bg-opacity-50 backdrop-blur z-50 border-b-slate-200 border-b-2 shadow-sm">
			<div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
				<Link to='/' className="flex gap-2 items-center">
					<img src={`${process.env.PUBLIC_URL}/kdd_logo_c.png`} alt="logo" className="h-16 py-2" />
					<p className="text-xl font-black text-slate-600">U-KTA</p>
				</Link>

				<div className="whitespace-nowrap flex h-full items-end gap-2 text-sm">
					<Link to="/morpheme"
						className={`
							${currentPage === "/morpheme" ? "text-slate-800 bg-slate-200 rounded-t-2xl" : "text-slate-500"} 
							hover:font-bold px-4 pt-2 pb-1 transition-all ease-in-out`
						}
					>
						형태소
					</Link>
					<Link to="/cohesion" className={`${currentPage === "/cohesion" ? "text-slate-800 bg-slate-200 rounded-t-2xl" : "text-slate-500"} hover:font-bold px-4 pt-2 pb-1 transition-all ease-in-out`}>자질</Link>
				</div>
			</div>
		</nav>
	);
};

export default Nav;
