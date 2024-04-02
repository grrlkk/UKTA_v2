import React, { useEffect, useState } from 'react';
import Pagination from './Pagination';

import ResultHeader from './ResultHeader';


const ResultsCoh = () => {
	const [cohesionResult, setCohesionResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(0);
	const [selectedAll, setSelectedAll] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch('https://ukta.inha.ac.kr/api/korcat/cohesion');
				const data = await response.json();
				setCohesionResult(data);
			} catch (error) {
				console.error(error);
			}
		};
		fetchData();
	}, []);

	const handleFileDownload = (item, type) => {
		if (type === 'csv') {
			console.log('csv');
			const csvData = selectedProperty.map(p => p.split('\t').join(',')).join('\n');
			const blob = new Blob([csvData], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${item._id}_cohesion.csv`;
			link.click();
			link.remove();
		} else {
			const data = JSON.stringify(item);
			const blob = new Blob([data], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${item._id}_cohesion.json`;
			link.click();
			link.remove();
		}
	}

	const handleSelectFile = (index) => {
		return () => {
			console.log(index);
			setSelectedProperty([])
			setSelectedAll(false);
			selectedFile === index ? setSelectedFile(-1) : setSelectedFile(index);
		}
	}

	const handleSelectProperty = (property) => {
		return () => {
			console.log(property);
			const updatedProperty = selectedProperty?.includes(property) ? selectedProperty.filter(p => p !== property) : [...selectedProperty, property];
			setSelectedProperty(updatedProperty);
			console.log(updatedProperty);
		};
	};

	const handleSelectAll = (results) => {
		return () => {
			if (selectedProperty.length === Object.entries(results).length) {
				setSelectedProperty([]);
				setSelectedAll(false);
			} else {
				setSelectedProperty(prevSelectedProperty => {
					const updatedProperty = Object.entries(results).map(([key, value]) => key + '\t' + value);
					return updatedProperty;
				});
				setSelectedAll(true);
			}
		};
	};

	const handleDelete = async (index) => {
		const id = cohesionResult[index]._id;

		try {
			const response = await fetch(`https://ukta.inha.ac.kr/api/korcat/cohesion/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id })
			});
		} catch (error) {
			console.error(error);
		} finally {
			console.log('deleted', id);
			const newCohesionResult = cohesionResult.filter((item, i) => i !== index);
			setCohesionResult(newCohesionResult);
		}
	};


	return (
		<div className='grid grid-cols-1 gap-4'>
			<h2 className="text-2xl font-bold py-2">자질 분석 결과</h2>

			<Pagination componentArray=
				{cohesionResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
					<div key={index} className={`p-4 rounded-lg overflow-hidden w-full shadow relative transition-all ${selectedFile === index ? 'bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}`}>
						<div className='grid grid-cols-1'>
							<div className='grid grid-cols-1 gap-4' onClick={handleSelectFile(index)}>
								<ResultHeader title={item.filename} content={item.contents} trunc={selectedFile !== index} />
							</div>

							<div key={index} className={`${selectedFile === index ? 'mt-4' : 'h-0 overflow-hidden'} transition-all ease-in-out pr-2 font-semibold`}>
								<hr className='mb-6' />

								<div className='bg-slate-200 rounded-lg text-sm overflow-hidden'>
									<div className='pr-[6px] border-b-[1px] shadow-sm bg-slate-300 rounded-t-lg border-slate-400 py-1'>
										<table className='w-full'>
											<thead className='w-full'>
												<tr className='text-left'>
													<th className='px-1 w-12'>
														<input type="checkbox" className='w-full accent-slate-600 align-middle' checked={selectedAll} onChange={handleSelectAll(item.results, index)} />
													</th>
													<th className='px-1 w-1/12'>순서</th>
													<th className='px-1'>자질 ({selectedProperty.length})</th>
													<th className='px-1 pr-4 w-32 text-right'>값</th>
												</tr>
											</thead>
										</table>
									</div>

									<div className='w-full overflow-y-scroll h-96'>
										<table className='w-full table-fixed'>
											<tbody className='w-full'>
												{Object.entries(item.results).map(([key, value]) => (
													<tr key={key} className='border-b-[1px] border-dotted border-b-slate-300 hover:bg-slate-300' onClick={handleSelectProperty(key + '\t' + value, index)}>
														<td className='p-1 w-12'>
															<input
																className='w-full accent-slate-600 align-middle'
																type="checkbox" id={key} name={key} value={key} checked={selectedProperty.includes(key + '\t' + value)} onChange={() => { }}
															/>
														</td>
														<td className='p-1 w-1/12 font-mono italic'>
															{Object.keys(item.results).indexOf(key) + 1}
														</td>
														<td className='p-1 break-all'>
															{key}
														</td>
														<td className='p-1 pr-4 w-32 text-right font-mono italic'>
															{value.toFixed(5)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>

						<div className={`absolute top-3 right-3 flex gap-2 text-sm pl-4`}>
							<div className='flex'>
								<button className={`grow sm:grow-0 p-2 bg-slate-500 text-white rounded-lg rounded-r-none hover:bg-slate-600 flex flex-nowrap gap-2`} onClick={() => handleFileDownload(item)}>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
									</svg>
									json
								</button>
								<button className={`grow sm:grow-0 pr-4 py-2 pl-2 bg-slate-500 text-white rounded-lg rounded-l-none hover:bg-slate-600 flex flex-nowrap gap-2`} onClick={() => handleFileDownload(item, "csv")}>
									csv
								</button>
							</div>

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

export default ResultsCoh;
