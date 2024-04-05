import React, { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import './App.css';

import Dummy from './components/Dummy';
import Foot from './components/Foot';
import Loading from './components/Loading';
import Nav from './components/Nav';
import ResultsCoh from './components/ResultsCohesion';
import ResultsMor from './components/ResultsMorpheme';
import TagInfo from './components/TagInfo';
import TextInput from './components/TextInput';


function App() {
	const currentPage = useLocation();
	const [darkMode, setDarkMode] = useState(() => {
		const preferredColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
		return preferredColorScheme ? true : false;
	});

	return (
		<div className={`App ${darkMode ? 'dark' : ''}`}>
			<div className="text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-950 transition-all ease-in-out min-w-[320px]">
				<Nav currentPage={currentPage.pathname} />

				<div className="items-start pt-32 grid grid-cols-1 gap-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className='fixed top-0'></div>

					<TextInput />

					<hr />

					<Routes>
						<Route path='/morpheme' element={<ResultsMor />} />
						<Route path='/cohesion' element={<ResultsCoh />} />
						<Route path='/tagging' element={<TagInfo />} />
						<Route path='/loading' element={<Loading />} />
						<Route path='*' element={<Dummy />} />
					</Routes>

					<div className='fixed bottom-0'></div>
				</div>

				<Foot darkMode={darkMode} setDarkMode={setDarkMode} />
			</div>
		</div>
	);
}

export default App;
