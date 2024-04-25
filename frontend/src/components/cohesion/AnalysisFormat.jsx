import React, { useState } from 'react';


const ResultsNumeric = ({ result, title }) => {
	const [selectedAll, setSelectedAll] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState([]);
	const [hidden, setHidden] = useState(true);

	const handleSelectProperty = (property) => {
		return () => {
			const updatedProperty = selectedProperty?.includes(property) ? selectedProperty.filter(p => p !== property) : [...selectedProperty, property];
			setSelectedProperty(updatedProperty);
			console.log(updatedProperty);
		};
	};

	const handleSelectAll = () => {
		return () => {
			if (selectedProperty.length === Object.entries(result).length) {
				setSelectedProperty([]);
				setSelectedAll(false);
			} else {
				setSelectedProperty(prevSelectedProperty => {
					const updatedProperty = Object.entries(result).map(([key, value]) => key + '\t' + value);
					return updatedProperty;
				});
				setSelectedAll(true);
			}
		};
	};

	const handleFileDownload = (type) => {
		if (type === 'csv') {
			if (selectedProperty.length === 0) {
				alert('선택된 자질이 없습니다.');
				return;
			}

			const csvData = selectedProperty.map(p => p.split('\t').join('\t')).join('\n');
			const blob = new Blob([csvData], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${title}_selected.csv`;
			link.click();
			link.remove();
		} else if (type === 'txt') {
			if (selectedProperty.length === 0) {
				alert('선택된 자질이 없습니다.');
				return;
			}

			const csvData = selectedProperty.map(p => p.split('\t').join('\t')).join('\n');
			const blob = new Blob([csvData], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${title}_selected.txt`;
			link.click();
			link.remove();
		}
	}

	return (
		<div className='rounded-xl text-sm overflow-hidden flex flex-col'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='text-lg font-semibold'>{title} Results</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0" : "max-h-96 pt-2"} transition-all ease-in-out`}>
				<div className='pr-[6px] table-header py-2'>
					<div className='flex ml-2 mb-2 items-center font-normal'>
						<button className={`sm:grow-0 btn-primary py-1 px-3 rounded-lg rounded-r-none flex flex-nowrap gap-1 items-center`} onClick={() => handleFileDownload("txt")}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
							</svg>
							txt
						</button>
						<button className={`sm:grow-0 btn-primary py-1 px-3 rounded-lg rounded-l-none`} onClick={() => handleFileDownload("csv")}>
							csv
						</button>
						<hr className="ml-2 grow" />
					</div>

					<table className='w-full'>
						<thead className='w-full'>
							<tr className='text-left'>
								<th className='px-3 w-12'>
									<input type="checkbox" className='w-full accent-slate-600 align-middle' checked={selectedAll} onChange={handleSelectAll()} />
								</th>
								<th className='px-1 w-1/12'>n.</th>
								<th className='px-1'>자질 ({selectedProperty.length})</th>
								<th className='px-1 pr-4 w-32 text-right'>값</th>
							</tr>
						</thead>
					</table>
				</div>

				<div className='table-contents w-full overflow-y-scroll max-h-64'>
					<table className='w-full table-fixed'>
						<tbody className='w-full'>
							{Object.entries(result).map(([key, value], index) => (
								<tr key={key} className='' onClick={handleSelectProperty(key + '\t' + value)}>
									<td className='p-1 px-3 w-12'>
										<input
											className='w-full accent-slate-600 align-middle'
											type="checkbox" id={key} name={key} value={key} checked={selectedProperty.includes(key + '\t' + value)} onChange={() => { }}
										/>
									</td>
									<td className='p-1 w-1/12 font-mono italic'>
										{Object.keys(result).indexOf(key) + 1}
									</td>
									<td className='p-1 break-all'>
										{key}
									</td>
									<td className='p-1 pr-4 w-32 text-right font-mono italic'>
										{value.toFixed(4)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

const ResultsList = ({ result, title }) => {
	const [selectedAll, setSelectedAll] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState([]);
	const [hidden, setHidden] = useState(true);

	const handleSelectProperty = (property) => {
		return () => {
			const updatedProperty = selectedProperty?.includes(property) ? selectedProperty.filter(p => p !== property) : [...selectedProperty, property];
			setSelectedProperty(updatedProperty);
			console.log(updatedProperty);
		};
	};

	const handleSelectAll = () => {
		return () => {
			if (selectedProperty.length === Object.entries(result).length) {
				setSelectedProperty([]);
				setSelectedAll(false);
			} else {
				setSelectedProperty(prevSelectedProperty => {
					const updatedProperty = Object.entries(result).map((item, index) => index);
					return updatedProperty;
				});
				setSelectedAll(true);
				console.log(selectedProperty);
			}
		};
	};

	const formatEntryTXT = (entry) => {
		const type = entry[0];
		const values = entry[1];
		const str = values.map(v => v[0] + '\t' + v[1] + '\t' + v[2] + '\t' + v[3]).join('\n');
		return `${type}\n${str}\n`;
	}

	const formatEntryCSV = (entry) => {
		const type = entry[0];
		const values = entry[1];
		const str = values.map(v => type + ',' + v[0] + ',' + v[1] + ',' + v[2] + ',' + v[3]).join('\n');
		return `${str}`;
	}

	const handleFileDownload = (type) => {
		if (type === 'csv') {
			if (selectedProperty.length === 0) {
				alert('선택된 자질이 없습니다.');
				return;
			}

			const csvData = selectedProperty.map(p => formatEntryCSV(Object.entries(result)[p])).join('\n');
			const BOM = "\uFEFF";
			const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${title}_selected.csv`;
			link.click();
			link.remove();
		} else if (type === 'txt') {
			if (selectedProperty.length === 0) {
				alert('선택된 자질이 없습니다.');
				return;
			}

			const csvData = selectedProperty.map(p => formatEntryTXT(Object.entries(result)[p])).join('\n');
			const blob = new Blob([csvData], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${title}_selected.txt`;
			link.click();
			link.remove();
		}
	}

	return (
		<div className='rounded-xl text-sm overflow-hidden flex flex-col transition-all ease-in-out'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='text-lg font-semibold'>{title} Results</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0" : "max-h-96 pt-2"} transition-all ease-in-out`}>
				<div className='pr-[6px] table-header py-2'>
					<div className='flex ml-2 mb-2 items-center font-normal'>
						<button className={`sm:grow-0 btn-primary py-1 px-3 rounded-lg rounded-r-none flex flex-nowrap gap-1 items-center`} onClick={() => handleFileDownload("txt")}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
							</svg>
							txt
						</button>
						<button className={`sm:grow-0 btn-primary py-1 px-3 rounded-lg rounded-l-none`} onClick={() => handleFileDownload("csv")}>
							csv
						</button>
						<hr className="ml-2 grow" />
					</div>

					<table className='w-full'>
						<thead className='w-full'>
							<tr className='text-left'>
								<th className='px-3 w-12'>
									<input type="checkbox" className='w-full accent-slate-600 align-middle' checked={selectedAll} onChange={handleSelectAll()} />
								</th>
								<th className='px-1 w-1/12'>n.</th>
								<th className='px-1 w-2/5'>자질 ({selectedProperty.length})</th>
								<td className='w-84'>
									<table className='w-full'>
										<tbody>
											<tr className='border-0 hover:bg-inherit'>
												<th className='px-1 w-1/12'>n.</th>
												<th className='px-1 w-2/12'>품사</th>
												<th className='px-1 w-1/12'>태그</th>
												<th className='px-1 w-8/12'>포함 문장</th>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</thead>
					</table>
				</div>

				<div className='table-contents w-full overflow-y-scroll max-h-64'>
					<table className='w-full table-fixed'>
						<tbody className='w-full'>
							{Object.entries(result).map(([key, value], index) => (
								<tr key={key} className='' onClick={handleSelectProperty(index)}>
									<td className='p-1 px-3 w-12'>
										<input
											className='w-full accent-slate-600 align-middle'
											type="checkbox" id={key} name={key} value={key} checked={selectedProperty.includes(index)} onChange={() => { }}
										/>
									</td>
									<td className='p-1 w-1/12 font-mono italic'>
										{Object.keys(result).indexOf(key) + 1}
									</td>
									<td className='p-1 w-2/5 break-all'>
										{key}
									</td>
									<td className='w-84'>
										<table className='w-full'>
											<tbody>
												{value.map((v) => (
													<tr className='last:border-0' key={v}>
														<td className='p-1 w-1/12 font-mono italic'>{v[0]}</td>
														<td className='p-1 w-2/12'>{v[1]}</td>
														<td className='p-1 w-1/12 font-mono italic'>{v[2]}</td>
														<td className='p-1 w-8/12 break-all'>{v[3]}</td>
													</tr>
												))}
											</tbody>
										</table>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};


export { ResultsNumeric, ResultsList };