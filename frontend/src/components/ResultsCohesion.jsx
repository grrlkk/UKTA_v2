import React, { useEffect, useState } from 'react';
import Pagination from './Pagination';

import ResultHeader from './ResultHeader';


const ResultsCoh = () => {
	const [cohesionResult, setCohesionResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(0);
	const [selectedProperty, setSelectedProperty] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch('https://ukta.inha.ac.kr/api/korcat/cohesion');
				const data = await response.json();
				setCohesionResult(data);
				console.log(data);
				for (let i = 0; i < data.length; i++) {
					selectedProperty.push([]);
				}
			} catch (error) {
				console.error(error);
			}
		};
		fetchData();
	}, [selectedProperty]);

	const handleFileDownload = (item, index, type) => {
		if (type === 'csv') {
			console.log('csv');
			const csvData = selectedProperty[index].map(p => p.split('\t').join(',')).join('\n');
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
			selectedFile === index ? setSelectedFile(-1) : setSelectedFile(index);
		}
	}

	const handleSelectProperty = (property, selectedFile) => {
		return () => {
			console.log(property);
			const updatedSelectedProperty = selectedProperty[selectedFile]?.includes(property)
				? selectedProperty[selectedFile].filter(p => p !== property)
				: [...(selectedProperty[selectedFile] || []), property];
			setSelectedProperty(prevSelectedProperty => {
				const updatedProperty = [...prevSelectedProperty];
				updatedProperty[selectedFile] = updatedSelectedProperty;
				return updatedProperty;
			});
			console.log(selectedProperty);
		};
	};

	const handleSelectAll = (results, index) => {
		return () => {
			if (selectedProperty[index].length === Object.entries(results).length) {
				setSelectedProperty(prevSelectedProperty => {
					const updatedProperty = [...prevSelectedProperty];
					updatedProperty[index] = [];
					return updatedProperty;
				});
			} else {
				setSelectedProperty(prevSelectedProperty => {
					const updatedProperty = [...prevSelectedProperty];
					updatedProperty[index] = Object.entries(results).map(([key, value]) => key + '\t' + value);
					return updatedProperty;
				});
			}
		};
	}


	return (
		<div className='grid grid-cols-1 gap-4'>
			<h2 className="text-3xl font-bold py-2">응집도 분석 결과</h2>
			<Pagination componentArray=
				{cohesionResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
					<div key={index} className={`p-4 border border-gray-300 rounded-lg overflow-auto w-full shadow relative transition-all ${selectedFile === index ? 'bg-slate-100' : 'bg-slate-50'}`}>
						<div className='grid grid-cols-1'>
							<div className='grid grid-cols-1 gap-4' onClick={handleSelectFile(index)}>
								<ResultHeader title={item.filename} content={item.contents} trunc={selectedFile != index} />
							</div>

							<div key={index} className={`${selectedFile === index ? 'h-96 mt-4 overflow-scroll' : 'h-0 overflow-hidden'} transition-all ease-in-out pr-2`}>
								<hr className='mb-6' />

								<table className='w-full'>
									<thead>
										<tr className='text-left border-b'>
											<th className='p-1'>
												<input type="checkbox" onChange={handleSelectAll(item.results, index)} />
											</th>
											<th className='p-1'>Property</th>
											<th className='p-1'>Value</th>
										</tr>
									</thead>
									<tbody>
										{Object.entries(item.results).map(([key, value]) => (
											<tr key={key} className='border-b hover:bg-slate-200' onClick={handleSelectProperty(key + '\t' + value, index)}>
												<td className='p-1'>
													<input type="checkbox" id={key} name={key} value={key} checked={selectedProperty[index]?.includes(key + '\t' + value)} onChange={() => { }} />
												</td>
												<td className='p-1'>
													{key}
												</td>
												<td className='p-1'>
													{value}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						<div className={`absolute top-3 right-2 flex gap-2 text-sm pl-4`}>
							<div className='flex'>
								<button className={`grow sm:grow-0 px-4 py-2 pr-2 bg-slate-500 text-white rounded-full rounded-r-none hover:bg-slate-600 flex flex-nowrap gap-2`} onClick={() => handleFileDownload(item)}>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
									</svg>
									json
								</button>
								<button className={`grow sm:grow-0 px-4 py-2 pl-2 bg-slate-500 text-white rounded-full rounded-l-none hover:bg-slate-600 flex flex-nowrap gap-2`} onClick={() => handleFileDownload(item, index, "csv")}>
									csv
								</button>
							</div>

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

export default ResultsCoh;
