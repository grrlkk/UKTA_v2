import React, { useState } from 'react';
import { CohTags, MorphTags } from "../../Tags";
import { Sentences, SentencesCorrection } from '../morpheme/SentenceFormat';


const MorphemeFormat = ({ results, grade, title }) => {
	// format morpheme analysis results
	const [hidden, setHidden] = useState(true);
	const handleMorphemeDownload = (item, type) => {
		if (type === 'txt') {
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

	return (
		<div className='text-sm overflow-hidden flex flex-col'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='font-semibold'>{title}</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0 hidden" : "h-auto block pt-2"} -pr-[6px] transition-all ease-in-out`}>
				<div className='flex flex-row divide-x-2 divide-slate-400 w-full justify-end font-normal'>
					<button onClick={() => handleMorphemeDownload(results, "json")} className={`btn-primary grow sm:grow-0 flex flex-nowrap gap-1`}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
						</svg>
						Morpheme Analysis json
					</button>
				</div>

				<Sentences results={results} grade={grade} />
			</div >
		</div>
	);
}

const CorrectionFormat = ({ results, title }) => {
	// format grammar correction results
	const [hidden, setHidden] = useState(true);

	return (
		<div className='text-sm overflow-hidden flex flex-col'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='font-semibold'>{title}</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0 hidden" : "h-auto block pt-2"} -pr-[6px] transition-all ease-in-out`}>
				<div className={`${hidden ? "h-0 hidden" : "h-auto block pt-2"} -pr-[6px] transition-all ease-in-out`}>
					<SentencesCorrection results={results} />
				</div >
			</div >
		</div>
	);
}

const ResultsNumeric = ({ result, title }) => {
	// format numerical results
	const [selectedAll, setSelectedAll] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState([]);
	const [hidden, setHidden] = useState(true);

	const handleSelectProperty = (property) => {
		return () => {
			const updatedProperty = selectedProperty?.includes(property) ? selectedProperty.filter(p => p !== property) : [...selectedProperty, property];
			setSelectedProperty(updatedProperty);
			// console.log(updatedProperty);
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
		<div className='text-sm overflow-hidden flex flex-col'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='font-semibold'>{title}</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0 hidden" : "max-h-96 block pt-2"} rounded-xl overflow-hidden transition-all ease-in-out`}>
				<div className='table-header p-2 rounded-t-xl'>
					<div className='flex items-center font-normal'>
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
				</div>

				<div className='table-contents w-full overflow-y-scroll max-h-72'>
					<table className='w-full table-fixed'>
						<thead className='w-full'>
							<tr className='text-left'>
								<th className='px-3 w-12 sticky top-0 table-header'>
									<input type="checkbox" className='w-full accent-slate-600 align-middle' checked={selectedAll} onChange={handleSelectAll()} />
								</th>
								<th className='px-1 w-1/12 sticky top-0 table-header'>n.</th>
								<th className='px-1 sticky top-0 table-header'>Tag ({selectedProperty.length})</th>
								<th className='px-1 sticky top-0 table-header'>Target</th>
								<th className='px-1 sticky top-0 table-header'>Description</th>
								<th className='px-1 pr-4 w-32 sticky top-0 table-header text-right'>Value</th>
							</tr>
						</thead>
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
									<td className='p-1'>
										{CohTags[key]?.alias || key}
									</td>
									{!key.includes("adjacent") &&
										<td className='p-1'>
											<div className='flex flex-col'>
												<span>
													{MorphTags.find(tag => tag.tag === key.split("C_")[0])?.desc ||
														MorphTags.find(tag => tag.tag === key.split("F_")[0])?.desc ||
														MorphTags.find(tag => tag.tag === key.split("_")[0])?.desc}
												</span>
												<span>
													{MorphTags.find(tag => tag.tag === key.split("C_")[0])?.desc_eng ||
														MorphTags.find(tag => tag.tag === key.split("F_")[0])?.desc_eng ||
														MorphTags.find(tag => tag.tag === key.split("_")[0])?.desc_eng}
												</span>
											</div>
										</td>}
									<td colSpan={key.includes("adjacent") && 2} className='p-1'>
										<div className="flex flex-col">
											<span>
												{key.includes("C_Den") & key !== "C_Den" ? "실질 형태소 밀도" :
													key.includes("F_Den") & key !== "F_Den" ? "형식 형태소 밀도" :
														CohTags[key.split("_")[1]]?.desc ||
														CohTags[key]?.desc}
											</span>
											<span className="">
												{key.includes("C_Den") & key !== "C_Den" ? "Content Morpheme Density" :
													key.includes("F_Den") & key !== "F_Den" ? "Formal Morpheme Density" :
														CohTags[key.split("_")[1]]?.desc_eng ||
														CohTags[key]?.desc_eng}
											</span>
										</div>
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
	// format list results
	const [selectedAll, setSelectedAll] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState([]);
	const [hidden, setHidden] = useState(true);
	const [expanded, setExpanded] = useState(false);

	const handleSelectProperty = (property) => {
		return () => {
			const updatedProperty = selectedProperty?.includes(property) ? selectedProperty.filter(p => p !== property) : [...selectedProperty, property];
			setSelectedProperty(updatedProperty);
			// console.log(updatedProperty);
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
				// console.log(selectedProperty);
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

	const handleExpand = () => {
		setExpanded(!expanded);
	}

	return (
		<div className='text-sm overflow-hidden flex flex-col transition-all ease-in-out'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='font-semibold'>{title}</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0 hidden" : "max-h-96 block pt-2"} rounded-xl overflow-hidden transition-all ease-in-out`}>
				<div className='table-header p-2 rounded-t-xl overflow-hidden'>
					<div className='flex items-center font-normal'>
						<button className={`sm:grow-0 btn-primary py-1 px-3 rounded-lg rounded-r-none flex flex-nowrap gap-1 items-center`} onClick={() => handleFileDownload("txt")}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
							</svg>
							txt
						</button>
						<button className={`sm:grow-0 btn-primary py-1 px-3 rounded-lg rounded-l-none`} onClick={() => handleFileDownload("csv")}>
							csv
						</button>
						<hr className="m-2 grow" />
						<button className={`sm:grow-0 btn-primary py-1 px-3 rounded-lg`} onClick={() => handleExpand()}>
							{expanded ? 'Fold' : 'Expand'}
						</button>
					</div>
				</div>

				<div className='table-contents w-full overflow-y-scroll max-h-72'>
					<table className='w-full table-fixed'>
						<thead className='w-full'>
							<tr className='text-left'>
								<th className='px-3 w-12 sticky top-0 table-header'>
									<input type="checkbox" className='w-full accent-slate-600 align-middle' checked={selectedAll} onChange={handleSelectAll()} />
								</th>
								<th className='px-1 w-1/12 sticky top-0 table-header'>n.</th>
								<th className='px-1 sticky top-0 table-header'>Tag ({selectedProperty.length})</th>
								<th className='px-1 sticky top-0 table-header'>Target</th>
								<th className='px-1 sticky top-0 table-header'>Description</th>
								{expanded && (
									<td className='w-1/2 sticky top-0 table-header'>
										<table className='w-full'>
											<tbody>
												<tr className='border-0 hover:bg-inherit'>
													<th className='px-1 w-1/12'>N.</th>
													<th className='px-1 w-1/4'>Morpheme</th>
													<th className='px-1 w-1/6'>Tag</th>
													<th className='px-1'>Containing Sentence</th>
												</tr>
											</tbody>
										</table>
									</td>
								)}
								{!expanded && (
									<th className='px-1 text-right pr-4 sticky top-0 table-header'>Morph Cnt</th>
								)}
							</tr>
						</thead>
						<tbody className='w-full'>
							{Object.entries(result).map(([key, value], index) => (
								<tr key={key} className='align-top' onClick={handleSelectProperty(index)}>
									<td className='p-1 px-3 w-12'>
										<input
											className='w-full accent-slate-600 align-middle'
											type="checkbox" id={key} name={key} value={key} checked={selectedProperty.includes(index)} onChange={() => { }}
										/>
									</td>
									<td className='p-1 w-1/12 font-mono italic'>
										{Object.keys(result).indexOf(key) + 1}
									</td>
									<td className='p-1 break-all'>
										{key}
									</td>
									<td className='p-1 break-all'>
										<div className='flex flex-col'>
											<span>
												{MorphTags.find(tag => tag.tag === key.split("_")[0])?.desc}
											</span>
											<span>
												{MorphTags.find(tag => tag.tag === key.split("_")[0])?.desc_eng}
											</span>
										</div>
									</td>
									<td className='p-1 break-all'>
										<div className='flex flex-col'>
											<span>
												{CohTags[key.split("_")[1]]?.desc ||
													CohTags[key]?.desc}
											</span>
											<span>
												{CohTags[key.split("_")[1]]?.desc_eng ||
													CohTags[key]?.desc_eng}
											</span>
										</div>
									</td>
									{expanded && (
										<td className='w-1/2'>
											<table className='w-full'>
												<tbody>
													{value.map((v) => (
														<tr className='last:border-0' key={v}>
															<td className='p-1 w-1/12 font-mono italic'>{v[0] + 1}</td>
															<td className='p-1 w-1/4'>{v[1]}</td>
															<td className='p-1 w-1/6 font-mono italic'>{v[2]}</td>
															<td className='p-1 w-1/2 break-all'>{v[3]}</td>
														</tr>
													))}
												</tbody>
											</table>
										</td>
									)}
									{!expanded && (
										<td className='px-1 font-mono italic text-right pr-4'>{value.length}</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

const ResultsListNgram = ({ result, title }) => {
	// format ngram results
	const [selectedAll, setSelectedAll] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState([]);
	const [hidden, setHidden] = useState(true);

	const handleSelectProperty = (property) => {
		return () => {
			const updatedProperty = selectedProperty?.includes(property) ? selectedProperty.filter(p => p !== property) : [...selectedProperty, property];
			setSelectedProperty(updatedProperty);
			// console.log(updatedProperty);
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
				// console.log(selectedProperty);
			}
		};
	};

	const formatEntryTXT = (entry) => {
		const type = entry[0];
		const values = entry[1];
		const str = Object.entries(values).map(([cnt, ngram]) => cnt + '\t' + ngram.join('\t')).join('\n');
		return `${type}\n${str}\n`;
	}

	const formatEntryCSV = (entry) => {
		const type = entry[0];
		const values = entry[1];
		const str = Object.entries(values).map(([cnt, ngram]) => type + ',' + cnt + ',' + ngram.join(',')).join('\n');
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
		<div className='text-sm overflow-hidden flex flex-col transition-all ease-in-out'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='font-semibold'>{title}</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0 hidden" : "max-h-96 block pt-2"} rounded-xl overflow-hidden transition-all ease-in-out`}>
				<div className='table-header p-2 rounded-t-xl overflow-hidden'>
					<div className='flex items-center font-normal'>
						<button className={`sm:grow-0 btn-primary py-1 px-3 rounded-lg rounded-r-none flex flex-nowrap gap-1 items-center`} onClick={() => handleFileDownload("txt")}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
							</svg>
							txt
						</button>
						<button className={`sm:grow-0 btn-primary py-1 px-3 rounded-lg rounded-l-none`} onClick={() => handleFileDownload("csv")}>
							csv
						</button>
						<hr className="m-2 grow" />
					</div>
				</div>

				<div className='table-contents w-full overflow-y-scroll max-h-72'>
					<table className='w-full table-fixed'>
						<thead className='w-full'>
							<tr className='text-left'>
								<th className='px-3 w-12 sticky top-0 table-header'>
									<input type="checkbox" className='w-full accent-slate-600 align-middle' checked={selectedAll} onChange={handleSelectAll()} />
								</th>
								<th className='px-1 w-1/12 sticky top-0 table-header'>n.</th>
								<th className='px-1 sticky top-0 table-header'>Tag ({selectedProperty.length})</th>
								<th className='px-1 sticky top-0 table-header'>Target</th>
								<th className='px-1 sticky top-0 table-header'>Description</th>
								<th className='px-1 w-1/3 sticky top-0 table-header'>
									<table>
										<tbody>
											<tr className=''>
												<td className='p-1 w-12'>Cnt</td>
												<td className='p-1'>
													Ngram
												</td>
											</tr>
										</tbody>
									</table>
								</th>
							</tr>
						</thead>
						<tbody className='w-full'>
							{Object.entries(result).map(([key, value], index) => (
								<tr key={key} className='align-top' onClick={handleSelectProperty(index)}>
									{console.log(value)}
									<td className='p-1 px-3 w-12'>
										<input
											className='w-full accent-slate-600 align-middle'
											type="checkbox" id={key} name={key} value={key} checked={selectedProperty.includes(index)} onChange={() => { }}
										/>
									</td>
									<td className='p-1 w-1/12 font-mono italic'>
										{Object.keys(result).indexOf(key) + 1}
									</td>
									<td className='p-1 break-all'>
										{key}
									</td>
									<td className='p-1 break-all'>
										<div className='flex flex-col'>
											<span>
												{MorphTags.find(tag => tag.tag === key.split("_")[0])?.desc}
											</span>
											<span>
												{MorphTags.find(tag => tag.tag === key.split("_")[0])?.desc_eng}
											</span>
										</div>
									</td>
									<td className='p-1 break-all'>
										<div className='flex flex-col'>
											<span>
												{CohTags[key.split("_")[1]]?.desc ||
													CohTags[key]?.desc}
											</span>
											<span>
												{CohTags[key.split("_")[1]]?.desc_eng ||
													CohTags[key]?.desc_eng}
											</span>
										</div>
									</td>
									<td className='p-1 w-1/3 break-all'>
										<table>
											<tbody>
												{Object.entries(value).map(([cnt, ngram]) => (
													<tr key={ngram} className=''>
														<td className='p-1 w-12'>{cnt}</td>
														<td className='p-1 flex flex-row flex-wrap gap-1'>
															{ngram.map((ng, idx) => (
																<span key={idx} className='px-1 bg-slate-300 border-slate-400 border-2'>{ng}</span>
															))}
														</td>
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

const GradeFormat = ({ results, title }) => {
	// format vocab grade results
	const [hidden, setHidden] = useState(true);

	return (
		<div className='text-sm overflow-hidden flex flex-col'>
			<button onClick={() => setHidden(!hidden)} className={`btn-icon flex gap-2 items-center`}>
				<h3 className='font-semibold'>{title}</h3>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${!hidden && "rotate-90"} transition-transform ease-in-out w-5 h-5`}>
					<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</button>

			<div className={`${hidden ? "h-0 hidden" : "h-auto block pt-2"} -pr-[6px] transition-all ease-in-out`}>
				<div className='overflow-hidden flex flex-col gap-2'>
					{results
						.sort((a, b) => b[0] - a[0])
						.map(([grade, words]) => (
							<div
								key={grade}
								className='flex flex-col bg-slate-300 dark:bg-slate-900 rounded-xl overflow-hidden'
							>
								<div className='flex flex-row justify-start items-center gap-2 p-2'>
									<h4 className='font-semibold'>
										{grade === "-1" ? "NA" : grade + "등급"}
									</h4>
									<span className=''>{words.length}개</span>
									<span className='font-normal opacity-50'>
										{grade === "1" && "학령전기에 습득하여 평생에 걸쳐 일상 언어생활 사용 어휘"}
										{grade === "2" && "초등학교 1-2학년"}
										{grade === "3" && "초등학교 3-4학년"}
										{grade === "4" && "초등학교 5-6학년"}
										{grade === "5" && "중학교 1-3학년"}
									</span>
									<hr className="grow" />
								</div>
								<div className='flex w-full bg-white dark:bg-slate-950'>
									<div className='flex flex-row overflow-x-auto divide-x-[1px]'>
										{words
											.sort((a, b) => a.voc.localeCompare(b.voc))
											.sort((a, b) => b.cnt - a.cnt)
											.map((word, index) => (
												<div
													key={index}
													title={word.meaning}
													className='flex flex-col items-center gap-1 font-base text-center p-2 hover:bg-slate-100 dark:hover:bg-slate-800 *:w-full'
												>
													<span className='text-nowrap border-b-[1px]'>{word.voc}</span>
													<div
														className='flex flex-row justify-center items-center gap-1'
														style={{ "color": MorphTags.find(t => t.tag === word.pos_tagged)?.color }}
													>
														<span className='text-nowrap'>{word.pos_tagged}</span>
														{word.pos && <span className='text-nowrap'>{word.pos}</span>}
													</div>
													{word.type && <span className='text-nowrap'>{word.type}</span>}
													<span className='text-nowrap font-normal font-mono italic text-xs'>{word.cnt}</span>
												</div>
											))}
									</div>
								</div>
							</div>
						))}
				</div>
			</div>
		</div>
	);
}



export { CorrectionFormat, GradeFormat, MorphemeFormat, ResultsList, ResultsListNgram, ResultsNumeric };
