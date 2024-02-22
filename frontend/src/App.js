import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import './App.css';
import 'react-tooltip/dist/react-tooltip.css'

import Nav from './components/Nav';
import Foot from './components/Foot';
import ResultsCoh from './components/ResultsCohesion';
import ResultsMor from './components/ResultsMorpheme';


function App() {
	const [inputValue, setInputValue] = useState(localStorage.getItem('inputValue') || '');
	const [selectedFile, setSelectedFile] = useState(null);
	const currentPage = useLocation();

	const handleAnalysis = (type) => {
		if (currentPage === type) {
			// Page is already loaded, no action needed
		} else {
		}
	};

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};

	const handleFileInputChange = (e) => {
		const file = e.target.files[0];
		setSelectedFile(file);

		const reader = new FileReader();
		reader.onload = (event) => {
			const fileContent = event.target.result;
			setInputValue(fileContent);
		};
		reader.readAsText(file);
	};

	const handleClearInput = () => {
		setInputValue('');
		setSelectedFile(null);
	};

	useEffect(() => {
		console.log(currentPage);
	}, [currentPage]);

	useEffect(() => {
		localStorage.setItem('inputValue', inputValue);
	}, [inputValue]);

	return (
		<div className="App text-slate-900 bg-white transition-all ease-in-out min-w-[320px]">
			<Nav currentPage={currentPage.pathname} />

			<div className="items-start pt-24 grid grid-cols-1 gap-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className='grid grid-cols-1 gap-4 '>
					<h2 className="text-3xl font-bold py-2">Text Input</h2>

					<div className='flex justify-end gap-2 text-sm'>
						<input type="file" accept=".txt" onChange={handleFileInputChange}
							className="
									file:mr-4 file:py-2 file:px-4
									file:rounded-full file:border-0
									file:bg-slate-500 file:text-white
									hover:file:bg-slate-600 hover:file:text-white
									file:cursor-pointer
									bg-slate-100 hover:bg-slate-200 rounded-full grow sm:grow-0
								"
						/>

						<button className={`flex-shrink-0 px-4 py-2 flex gap-2 bg-red-400 text-white rounded-full hover:bg-red-500 group`} onClick={handleClearInput}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-all ease-in-out group-hover:rotate-90">
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
							Clear
						</button>

					</div>

					<textarea
						value={inputValue}
						onChange={handleInputChange}
						className="p-2 border border-gray-300 rounded-lg overflow-auto h-[20vh] w-full"
						placeholder="Enter text"
					></textarea>

					<div className='flex justify-end text-center gap-2 text-sm whitespace-nowrap'>
						<Link to='/morpheme' className={`grow sm:grow-0 px-4 py-2 bg-slate-500 text-white rounded-full hover:bg-slate-600`} onClick={() => handleAnalysis('/morpheme')}>
							Morpheme
						</Link>

						<Link to='/cohesion' className={`grow sm:grow-0 px-4 py-2 bg-slate-500 text-white rounded-full hover:bg-slate-600`} onClick={() => handleAnalysis('/cohesion')}>
							Cohesion
						</Link>
					</div>
				</div>

				<hr />

				<Routes>
					<Route path='/morpheme' element={<ResultsMor />} />
					<Route path='/cohesion' element={<ResultsCoh />} />
				</Routes>

				<hr className={`${currentPage.pathname === '/' ? "hidden" : "block"}`} />
				<div className={`${currentPage.pathname === '/' ? "my-28" : "hidden"}`}></div>

			</div>

			<Foot />
		</div>
	);
}

export default App;
