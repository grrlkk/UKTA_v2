import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import './App.css';
import 'react-tooltip/dist/react-tooltip.css'

import Nav from './components/Nav';
import Foot from './components/Foot';
import ResultsCoh from './components/ResultsCohesion';
import ResultsMor from './components/ResultsMorpheme';
import Loading from './components/Loading';
import Dummy from './components/Dummy';


function App() {
	const [inputValue, setInputValue] = useState(localStorage.getItem('inputValue') || '');
	const [uploadInProgress, setUploadInProgress] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const currentPage = useLocation();
	const navigate = useNavigate();

	const handleAnalysis = async (type) => {
		setUploadInProgress(true);
		const formData = new FormData();
		formData.append("files", new Blob([inputValue], { type: "text/plain" }), inputValue.slice(0, inputValue.length / 3) + "...");

		try {
			const response = await fetch(`https://ukta.inha.ac.kr/api/korcat/${type}`, {
				method: 'POST',
				body: formData,
			});

			const data = await response.json();
			console.log(data);
		} catch (error) {
			console.error(error);
		} finally {
			setUploadInProgress(false);
			handleClearInput();
			navigate(`/${type}`);
		}
	}

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
		localStorage.setItem('inputValue', e.target.value);
	};

	const handleFileInputChange = (e) => {
		const file = e.target.files[0];
		setSelectedFile(file);

		const reader = new FileReader();
		reader.onload = (event) => {
			const fileContent = event.target.result;
			setInputValue(fileContent);
			localStorage.setItem('inputValue', e.target.value);
		};
		reader.readAsText(file);
	};

	const handleClearInput = () => {
		setInputValue('');
		localStorage.setItem('inputValue', '');
		setSelectedFile(null);
	};

	useEffect(() => {
		localStorage.setItem('inputValue', inputValue);
	}, [inputValue]);

	return (
		<div className="App text-slate-900 bg-white transition-all ease-in-out min-w-[320px]">
			<Nav currentPage={currentPage.pathname} />

			<div className="items-start pt-32 grid grid-cols-1 gap-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className='grid grid-cols-1 gap-4 '>
					<h2 className="text-3xl font-bold py-2">한국어 입력</h2>

					<div className='flex justify-end gap-2 text-sm shrink'>
						<input type="file" accept=".txt" onChange={handleFileInputChange}
							className="
									file:mr-4 file:py-2 file:px-4
									file:rounded-full file:border-0
									file:bg-slate-500 file:text-white
									hover:file:bg-slate-600 hover:file:text-white
									file:cursor-pointer
									bg-slate-100 hover:bg-slate-200 rounded-full grow sm:grow-0 shrink transition-all ease-in-out w-1/3
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
						className={`p-2 border border-gray-300 rounded-lg overflow-auto transition-all ease-in-out w-full ${inputValue.length === 0 ? ' h-[4em] focus:h-32' : 'h-32'}`}
						placeholder="Enter text"
					></textarea>

					<div className='flex justify-end text-center gap-2 text-sm whitespace-nowrap'>
						{uploadInProgress ?
							<button className='px-4 py-2 flex gap-1 grow sm:grow-0 bg-slate-500 text-white rounded-full cursor-not-allowed'>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-spin">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
								</svg>
								분석중...
							</button> :
							inputValue === '' ?
								<button className='px-4 py-2 flex gap-1 grow sm:grow-0 bg-slate-500 text-white justify-center rounded-full cursor-not-allowed'>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-pulse">
										<path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
									</svg>
									한국어 입력 후 분석하기
								</button> :
								<>
									<Link to='/loading' className={`grow sm:grow-0 px-4 py-2 bg-slate-500 text-white rounded-full hover:bg-slate-600`} onClick={() => handleAnalysis('morpheme')}>
										형태소 분석
									</Link>

									<Link to='/loading' className={`grow sm:grow-0 px-4 py-2 bg-slate-500 text-white rounded-full hover:bg-slate-600`} onClick={() => handleAnalysis('cohesion')}>
										응집도 분석
									</Link>
								</>}
					</div>
				</div>

				<hr />

				<Routes>
					<Route path='/morpheme' element={<ResultsMor />} />
					<Route path='/cohesion' element={<ResultsCoh />} />
					<Route path='/loading' element={<Loading />} />
					<Route path='*' element={<Dummy />} />
				</Routes>
			</div>

			<Foot />
		</div>
	);
}

export default App;
