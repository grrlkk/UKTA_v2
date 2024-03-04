import React, { useEffect, useState } from 'react';
import Tags from './Tags';
import Pagination from './Pagination';


const ResultsMor = () => {
	const [morphemeResult, setMorphemeResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(0);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch('http://165.246.44.231:8000/korcat/morpheme');
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

	return (
		<div className='grid grid-cols-1 gap-4 fade-in'>
			<h2 className="text-3xl font-bold py-2">형태소 분석 결과</h2>

				<Pagination componentArray=
					{morphemeResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
						<div key={index} className={`p-4 h-fit border border-gray-300 rounded-lg overflow-auto w-full relative transition-all ${selectedFile === index ? 'bg-slate-100' : 'bg-slate-50'}`}>
							<div className={`grid grid-cols-1`}>
								<div className='grid grid-cols-1 gap-4' onClick={handleSelectFile(index)}>
									<h3 className='text-xl font-bold'>{item.filename}</h3>
									<p>{item.contents}</p>
								</div>

								<div className={`flex gap-3 overflow-x-scroll overflow-y-hidden transition-all ease-in-out ${selectedFile === index ? "h-20 mt-4" : "h-0 overflow-hidden"}`}>
									{item.results.map((morph, index) => {
										return (
											<div key={index + morph} id={`${morph[1]}`} className={`group hover:bg-slate-200 relative text-sm font-bold flex-col whitespace-nowrap p-2 border-x-2 mb-2`}>
												<div className='flex justify-center'>
													{morph[0]}
												</div>
												<div className='flex flex-col justify-center group-hover:gap-1 text-xs gap-1' style={{ "color": Tags.find(tag => tag.tag === morph[1])?.color }}>
													<span className='flex justify-center'>
														{morph[1]}
													</span>
													<span className='flex justify-center'>
														{Tags.find(tag => tag.tag === morph[1])?.desc}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							<div className='absolute top-3 right-2 flex gap-2 text-sm'>
								<button className={`grow sm:grow-0 px-4 py-2 bg-slate-500 text-white rounded-full hover:bg-slate-600 flex flex-nowrap gap-2`} onClick={() => handleFileDownload(item)}>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
									</svg>
									json
								</button>

								<div className={`grow sm:grow-0 p-2 transition-all ease-in-out ${selectedFile === index ? '' : 'rotate-90'}`} onClick={handleSelectFile(index)}>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
										<path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
									</svg>
								</div>
							</div>
						</div>
					))} />
			</div>
	);
};

export default ResultsMor;
