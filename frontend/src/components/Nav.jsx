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
		<nav className="fixed bg-slate-50 bg-opacity-30 dark:bg-slate-950 dark:bg-opacity-30 w-full backdrop-blur-xl z-50 shadow-sm">
			<div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
				<Link to='/' className="flex gap-2 items-center group">
					<img src={`${process.env.PUBLIC_URL}/kdd_logo.png`} alt="logo" className="h-12 py-2 group-hover:scale-110 transition-all ease-in-out" />
					<p className="text-lg font-black group-hover:text-slate-500">UKTA</p>
				</Link>

				<div className="whitespace-nowrap items-end flex text-sm *:px-2 divide-x-2 dark:divide-slate-700">
					<Link to="/morpheme"
						className={`
							hover:text-slate-500
							${currentPage === "/morpheme" ?
								"font-bold" :
								"text-opacity-50"
							} 
							transition-all ease-in-out`
						}
					>
						형태소
					</Link>
					<Link to="/cohesion"
						className={`
							hover:text-slate-500
							${currentPage === "/cohesion" ?
								"font-bold" :
								"text-opacity-50"
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
