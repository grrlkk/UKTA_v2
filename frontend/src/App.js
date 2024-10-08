import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import './App.css';

import Dummy from './components/Dummy';
import Foot from './components/Foot';
import Loading from './components/Loading';
import Nav from './components/Nav';
import TagInfo from './components/TagInfo';
import TextInput from './components/TextInput';
import ResultsCoh from './components/cohesion/ResultsCohesion';
import ResultsMor from './components/morpheme/ResultsMorpheme';


function App() {
	const currentPage = useLocation();
	const [uploadInProgress, setUploadInProgress] = useState(false);
	const [darkMode, setDarkMode] = useState(() => {
		const preferredColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
		return preferredColorScheme ? true : false;
	});

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [currentPage]);

	return (
		<div className={`App ${darkMode ? 'dark' : ''} overflow-x-hidden`}>
			<div
				className='fixed top-0 h-full w-full z-0 
					bg-gradient-to-b from-slate-50 dark:from-slate-950 dark:via-black via-white to-slate-50 dark:to-slate-950
				'
			></div>

			<div className="relative text-slate-900 dark:text-slate-50 transition-all ease-in-out min-w-[320px]">
				<Nav currentPage={currentPage.pathname} />

				<div className="items-start pt-32 grid grid-cols-1 gap-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className='fixed top-0'></div>

					<TextInput uploadInProgress={uploadInProgress} setUploadInProgress={setUploadInProgress} />

					<hr id="content_area_start" />

					<div className='min-h-80'>
						<AnimatePresence mode='wait'>
							<Routes location={currentPage} key={currentPage.pathname}>
								<Route path='/' element={<Dummy />} />
								<Route path='/morpheme' element={<ResultsMor />} />
								<Route path='/cohesion' element={<ResultsCoh />} />
								<Route path='/tagging' element={<TagInfo />} />
								{uploadInProgress && <Route path='/loading' element={<Loading />} />}
								<Route path='*' element={<Navigate to="/" />} />
							</Routes>
						</AnimatePresence>
					</div>

					<div className='fixed bottom-0'></div>
				</div>

				<Foot darkMode={darkMode} setDarkMode={setDarkMode} />
			</div>
		</div>
	);
}

export default App;
