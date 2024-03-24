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
		<nav className="bg-slate-50 fixed w-full bg-opacity-50 backdrop-blur z-50 border-b-slate-100 border-b-[1px] shadow-sm">
			<div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
				<Link to='/' className="flex gap-2 items-center group">
					<img src={`${process.env.PUBLIC_URL}/kdd_logo_c.png`} alt="logo" className="h-16 py-2 group-hover:scale-110 transition-all ease-in-out" />
					<p className="text-lg font-black text-slate-600 group-hover:text-slate-900">U-KTA</p>
				</Link>

				<div className="whitespace-nowrap items-end flex text-sm *:px-2 divide-x-2">
					<Link to="/morpheme"
						className={`
							${currentPage === "/morpheme" ?
								"font-bold text-slate-700 hover:text-slate-900" :
								"text-slate-400 hover:text-slate-700"
							} 
							transition-all ease-in-out`
						}
					>
						형태소
					</Link>
					<Link to="/cohesion"
						className={`
							${currentPage === "/cohesion" ?
								"font-bold text-slate-700 hover:text-slate-900" :
								"text-slate-400 hover:text-slate-700"
							} 
							transition-all ease-in-out`
						}
					>
						자질
					</Link>
				</div>
			</div>
		</nav>
	);
};

export default Nav;
