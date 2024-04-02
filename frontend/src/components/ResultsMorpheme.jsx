import React, { useEffect, useState } from 'react';
import Pagination from './Pagination';

import ResultHeader from './ResultHeader';
import Sentence from './SentenceFormat';


const ResultsMor = () => {
	const [morphemeResult, setMorphemeResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(0);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch('https://ukta.inha.ac.kr/api/korcat/morpheme');
				const data = await response.json();
				setMorphemeResult(data);
			} catch (error) {
				console.error(error);
			}
		};
		fetchData();
	}, []);

	const handleFileDownload = (item) => {
		const data = JSON.stringify(item);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${item._id}_morpheme.json`;
		link.click();
		link.remove();
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
			const newMorphemeResult = morphemeResult.filter((item, i) => i !== index);
			setMorphemeResult(newMorphemeResult);
		}
	}

	return (
		<div className='grid grid-cols-1 gap-4'>
			<h2 className="text-2xl font-bold py-2">형태소 분석 결과</h2>

			<Pagination componentArray=
				{morphemeResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
					<div key={index} className={`p-4 h-fit rounded-lg overflow-auto w-full shadow relative transition-all ${selectedFile === index ? 'bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}`}>
						<div className={`grid grid-cols-1`}>
							<div className='grid grid-cols-1 gap-4' onClick={handleSelectFile(index)}>
								<ResultHeader title={item.filename} content={item.contents} trunc={selectedFile !== index} />
							</div>

							<div className={`overflow-y-hidden transition-all ease-in-out grid grid-cols-1 ${selectedFile === index ? "mt-4" : "h-0 overflow-hidden"}`}>
								<hr className='mb-6' />
								<Sentence result={item.results_full} content={item.contents} />
							</div>
						</div>

						<div className='absolute top-3 right-3 flex gap-2 text-sm '>
							<button className={`grow sm:grow-0 p-2 pr-4 bg-slate-500 text-white rounded-lg hover:bg-slate-600 flex flex-nowrap gap-2`} onClick={() => handleFileDownload(item)}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
								</svg>
								json
							</button>

							<button className={`grow sm:grow-0 p-2 bg-red-400 text-white rounded-lg hover:bg-red-500 flex flex-nowrap gap-2 group`} onClick={() => handleDelete(index)}>
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
