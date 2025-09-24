import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import OriginalText from '../components/OriginalText';
import Pagination from '../components/Pagination';
import { Sentences } from './SentenceFormat';

const ResultsMor = () => {
	const [morphemeResult, setMorphemeResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(0);

	const fetchData = async () => {
		try {
			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/morpheme`);  
			const data = await response.json();
			console.log('Response Data:', data);
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
			window.scrollTo({ top: position + window.scrollY - 100, behavior: 'smooth' });
		}
	}, [selectedFile]);

	// const convertToCSV = (sentences) => {
	// 	if (!Array.isArray(sentences) || sentences.length === 0) {
	// 		console.warn('convertToCSV: 입력 데이터가 배열이 아니거나 비어 있음.', sentences);
	// 		return '';
	// 	}
	
	// 	const rows = [];
	
	// 	sentences.forEach(sentence => {
	// 		console.log("📌 Sentence Text:", sentence?.text?.content);
	
	// 		sentence.tokens?.forEach(token => {
	// 			token.morphemes?.forEach(morph => {
	// 				rows.push({
	// 					sentence: sentence.text?.content ?? '',
	// 					word: token.text?.content ?? '',
	// 					morpheme: morph.text?.content ?? '',
	// 					tag: morph.pos?.tag ?? '',
	// 					tag_desc: morph.pos?.desc ?? ''
	// 				});
	// 			});
	// 		});
	// 	});
	
	// 	if (rows.length === 0) {
	// 		console.warn("❗ rows가 비어 있음. 형태소가 없는 문장일 수 있음.");
	// 	}
	
	// 	const header = Object.keys(rows[0]);
	// 	const csvRows = [header.join(',')];
	
	// 	rows.forEach(row => {
	// 		const values = header.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`);
	// 		csvRows.push(values.join(','));
	// 	});
	
	// 	const csvString = csvRows.join('\n');
	// 	console.log("✅ Generated CSV preview:\n", csvString.slice(0, 500)); // 처음 500자만 보기
	
	// 	return csvString;
	// };
	
	const convertToCSV = (data) => {
		if (!data || !Array.isArray(data.sentences)) return '';
	
		const rows = [["번호", "문장 분석", "어절 분석", "형태소 분석", "형태소 태그", "형태소 명칭"]];
	
		data.sentences.forEach((sentence, sIndex) => {
			const sentenceText = sentence.refined || sentence.text?.content || '';
			sentence.tokens?.forEach(token => {
				const tokenText = token.text?.content || '';
				token.morphemes?.forEach(morph => {
					rows.push([
						sIndex + 1,
						sentenceText,
						tokenText,
						morph.text?.content || morph.text || '',   // 🔥 여기 수정 중요
						morph.tag || '',
						MorphTags.find(t => t.tag === morph.tag)?.desc || ''
					]);
				});
			});
		});
	
		return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
	};
	
	

	const handleFileDownload = (item, type) => {
		if (type === 'txt') {
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
		} else if (type === 'csv') {
			const csv = convertToCSV(item);
			console.log('Generated CSV:', csv);  // 이거 추가 
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${item._id}_morpheme.csv`;
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
	};

	const handleSelectFile = (index) => {
		return () => {
			setSelectedFile(index);
		};
	};

	const handleDelete = async (index) => {
		const id = morphemeResult[index]._id;

		try {
			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/morpheme/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id })
			});
		} catch (error) {
			console.error(error);
		} finally {
			setMorphemeResult([]);
			await new Promise(resolve => setTimeout(resolve, 500));
			await fetchData();

			if (morphemeResult.length > 0) {
				setSelectedFile(0);
			}
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: 100 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -100 }}
			transition={{ duration: 0.1 }}
			className='grid grid-cols-1 gap-4'
		>
			<h2 className="text-2xl font-bold py-2">Morpheme Analysis Results</h2>

			<Pagination componentArray={
				morphemeResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
					<div
						id={"mor_" + index}
						key={index}
						onClick={handleSelectFile(index)}
						className={`
							p-4 h-fit rounded-3xl overflow-auto w-full shadow relative transition-all 
							${selectedFile === index ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
					>
						<div className={`grid grid-cols-1`}>
							<h3 className='pb-4 text-lg font-bold truncate'>{index + 1}. {item.filename}</h3>
							<OriginalText content={item.contents} trunc={selectedFile !== index} date={item.upload_date} procTime={item.process_time} />

							<div className={`flex flex-col gap-4 overflow-y-hidden transition-all ease-in-out ${selectedFile === index ? "mt-4" : "h-0 overflow-hidden"}`}>
								<hr className='' />
								<Sentences results={item.results} />
							</div>
						</div>

						<div className='absolute top-4 right-4 flex gap-2 text-sm '>
							<div className='flex'>
								<button className={`btn-primary grow sm:grow-0 rounded-l-3xl flex flex-nowrap gap-1`} onClick={() => handleFileDownload(item)}>
									json
								</button>
								<button className={`btn-primary grow sm:grow-0 rounded-none flex flex-nowrap gap-1`} onClick={() => handleFileDownload(item, "csv")}>
									csv
								</button>
								<button className={`btn-primary grow sm:grow-0 rounded-r-3xl flex flex-nowrap gap-1`} onClick={() => handleFileDownload(item, "txt")}>
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
				))
			} setSelectedFile={setSelectedFile} />
		</motion.div>
	);
};

export default ResultsMor;


// import { motion } from 'framer-motion';
// import React, { useEffect, useState } from 'react';
// import OriginalText from '../components/OriginalText';
// import Pagination from '../components/Pagination';
// import { Sentences } from './SentenceFormat';


// const ResultsMor = () => {
// 	const [morphemeResult, setMorphemeResult] = useState([]);
// 	const [selectedFile, setSelectedFile] = useState(0);

// 	const fetchData = async () => {
// 		try {
// 			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/morpheme`);
// 			const data = await response.json();
// 			setMorphemeResult(data);
// 		} catch (error) {
// 			console.error(error);
// 		}
// 	};

// 	useEffect(() => {
// 		fetchData();
// 	}, []);

// 	useEffect(() => {
// 		const element = document.getElementById('mor_' + selectedFile);

// 		if (element) {
// 			let position = element.getBoundingClientRect().top;
// 			window.scrollTo({ top: position + window.scrollY - 100, behavior: 'smooth' });
// 		}
// 	}, [selectedFile]);

// 	const handleFileDownload = (item, type) => {
// 		if (type === 'txt') {
// 			let results = item.results;
// 			for (let i = 0; i < results.length; i++) {
// 				results[i] = results[i].join('\n');
// 			}
// 			const blob = new Blob([results.join('\n')], { type: 'text/plain' });
// 			const url = URL.createObjectURL(blob);
// 			const link = document.createElement('a');
// 			link.href = url;
// 			link.download = `${item._id}_morpheme.txt`;
// 			link.click();
// 			link.remove();
// 		} else {
// 			const data = JSON.stringify(item);
// 			const blob = new Blob([data], { type: 'application/json' });
// 			const url = URL.createObjectURL(blob);
// 			const link = document.createElement('a');
// 			link.href = url;
// 			link.download = `${item._id}_morpheme.json`;
// 			link.click();
// 			link.remove();
// 		}
// 	}

// 	const handleSelectFile = (index) => {
// 		return () => {
// 			setSelectedFile(index);
// 		}
// 	}

// 	const handleDelete = async (index) => {
// 		const id = morphemeResult[index]._id;

// 		try {
// 			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/morpheme/${id}`, {
// 				method: 'DELETE',
// 				headers: {
// 					'Content-Type': 'application/json',
// 				},
// 				body: JSON.stringify({ id })
// 			});
// 		} catch (error) {
// 			console.error(error);
// 		} finally {
// 			setMorphemeResult([]);
// 			await new Promise(resolve => setTimeout(resolve, 500));
// 			await fetchData();

// 			if (morphemeResult.length > 0) {
// 				setSelectedFile(0);
// 			}
// 		}
// 	}

// 	return (
// 		<motion.div
// 			initial={{ opacity: 0, x: 100 }}
// 			animate={{ opacity: 1, x: 0 }}
// 			exit={{ opacity: 0, x: -100 }}
// 			transition={{ duration: 0.1 }}
// 			className='grid grid-cols-1 gap-4'
// 		>
// 			<h2 className="text-2xl font-bold py-2">Morpheme Analysis Results</h2>

// 			<Pagination componentArray=
// 				{morphemeResult.sort((a, b) => -a._id.localeCompare(b._id)).map((item, index) => (
// 					<div
// 						id={"mor_" + index}
// 						key={index}
// 						onClick={handleSelectFile(index)} s
// 						className={`
// 							p-4 h-fit rounded-3xl overflow-auto w-full shadow relative transition-all 
// 							${selectedFile === index ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
// 					>
// 						<div className={`grid grid-cols-1`}>
// 							<h3 className='pb-4 text-lg font-bold truncate'>{index + 1}. {item.filename}</h3>
// 							<OriginalText content={item.contents} trunc={selectedFile !== index} date={item.upload_date} procTime={item.process_time} />

// 							<div className={`flex flex-col gap-4 overflow-y-hidden transition-all ease-in-out ${selectedFile === index ? "mt-4" : "h-0 overflow-hidden"}`}>
// 								<hr className='' />
// 								<Sentences results={item.results} />
// 							</div>
// 						</div>

// 						<div className='absolute top-4 right-4 flex gap-2 text-sm '>
// 							<div className='flex'>
// 								<button className={`btn-primary grow sm:grow-0 rounded-r-none flex flex-nowrap gap-1`} onClick={() => handleFileDownload(item)}>
// 									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
// 										<path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
// 									</svg>
// 									json
// 								</button>
// 								<button className={`btn-primary grow sm:grow-0 rounded-l-none flex flex-nowrap gap-1`} onClick={() => handleFileDownload(item, "txt")}>
// 									txt
// 								</button>
// 							</div>

// 							<button className={`grow sm:grow-0 btn-red p-2 flex flex-nowrap gap-1 group`} onClick={() => handleDelete(index)}>
// 								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-all ease-in-out">
// 									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
// 								</svg>
// 							</button>
// 						</div>
// 					</div>
// 				))} setSelectedFile={setSelectedFile} />
// 		</motion.div>
// 	);
// };

// export default ResultsMor;
