import React, { useEffect, useState } from 'react';
import Pagination from './Pagination';

import ResultHeader from './ResultHeader';
import Sentence from './SentenceFormat';


const ResultsMor = () => {
	const [morphemeResult, setMorphemeResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(0);

	const fetchData = async () => {
		try {
			const response = await fetch('https://ukta.inha.ac.kr/api/korcat/morpheme');
			const data = await response.json();
			setMorphemeResult(data);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		const element = document.getElementById('mor_' + selectedFile);
		if (element) {
			let position = element.getBoundingClientRect().top;
			console.log(position);
			window.scrollTo({ top: position + window.scrollY - 100, behavior: 'smooth' });
		}

	}, [selectedFile]);

	const handleFileDownload = (item, type) => {
		if (type === 'txt') {
			console.log(item.results);
			let results = item.results;
			for (let i = 0; i < results.length; i++) {
				results[i] = results[i].join('\n');
			}
			const blob = new Blob([results.join('\n')], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${item._id}_morpheme.txt`;
			link.click();
			link.remove();
		} else {
			const data = JSON.stringify(item);
			const blob = new Blob([data], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${item._id}_morpheme.json`;
			link.click();
			link.remove();
		}
	}

	const handleSelectFile = (index) => {
		return () => {
			console.log(index);
			selectedFile === index ? setSelectedFile(-1) : setSelectedFile(index);
		}
	}

	const handleDelete = async (index) => {
		const id = morphemeResult[index]._id;

		try {
			const response = await fetch(`https://ukta.inha.ac.kr/api/korcat/morpheme/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id })
			});
		} catch (error) {
			console.error(error);
		} finally {
			console.log('deleted', id);
			setMorphemeResult([]);
			fetchData();
			setSelectedFile(0);
		}
	}

	return (
		<div className='grid grid-cols-1 gap-4'>
			<h2 className="text-2xl font-bold py-2">형태소 분석 결과</h2>

			<Pagination componentArray=
				{morphemeResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
					<div id={"mor_" + index} key={index} className={`p-4 h-fit rounded-xl overflow-auto w-full shadow relative transition-all ${selectedFile === index ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
						<div className={`grid grid-cols-1`}>
							<div className='grid grid-cols-1 gap-8' onClick={handleSelectFile(index)}>
								<ResultHeader title={item.filename} content={item.contents} trunc={selectedFile !== index} />
							</div>

							<div className={`overflow-y-hidden transition-all ease-in-out grid grid-cols-1 ${selectedFile === index ? "mt-4" : "h-0 overflow-hidden"}`}>
								<hr className='mb-6' />

								<Sentence result={item.results_full} content={item.contents} />
							</div>
						</div>

						<div className='absolute top-3 right-3 flex gap-2 text-sm '>
							<div className='flex'>
								<button className={`btn-primary grow sm:grow-0 rounded-r-none flex flex-nowrap gap-1`} onClick={() => handleFileDownload(item)}>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
									</svg>
									json
								</button>
								<button className={`btn-primary grow sm:grow-0 rounded-l-none flex flex-nowrap gap-1`} onClick={() => handleFileDownload(item, "txt")}>
									txt
								</button>
							</div>

							<button className={`grow sm:grow-0 btn-red p-2 flex flex-nowrap gap-1 group`} onClick={() => handleDelete(index)}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-all ease-in-out">
									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
				))} />
		</div>
	);
};

export default ResultsMor;
