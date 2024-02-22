import React, { useEffect, useState } from 'react';


const dummy_cohes = [
	{
		"filename": "test.txt",
		"contents": "This is a test file",
		"results": [{
			'lemmaCnt': 33,
			'average_sentence_similarity': 0.32634028792381287,
			'topic_consistency': 0.4278,
			'conjuctions': 0.030303030303030304,
			'lemmattr': 0.9696969696969697,
			'lemmaMattr': -1,
			'lexicalDensityTokens': 0.009105098855359001,
			'lexicalDensityTypes': 0.00023649607416516885,
			'contentTtr': 0.025974025974025976,
			'functionTtr': 0.023172905525846704,
			'nounTtr': 0.025846702317290554,
			'verbTtr': 0.030303030303030304,
			'adjTtr': 0,
			'advTtr': 0.030303030303030304,
			'bigramLemmaTtr': 1.0,
			'trigramLemmaTtr': 1.0,
			'adjacent_sentence_overlap_all_lemmas': 11,
			'adjacent_sentence_overlap_all_lemmas_normed': 2,
			'binary_adjacent_sentence_overlap_all_lemmas': 2,
			'adjacent_two_sentence_overlap_all_lemmas': 4,
			'adjacent_two_sentence_overlap_all_lemmas_normed': 1,
			'binary_adjacent_two_sentence_overlap_all_lemmas': 1,
			'adjacent_sentence_overlap_content_lemmas': 3,
			'adjacent_sentence_overlap_content_lemmas_normed': 2,
			'binary_adjacent_sentence_overlap_content_lemmas': 2,
			'adjacent_two_sentence_overlap_content_lemmas': 1,
			'adjacent_two_sentence_overlap_content_lemmas_normed': 1,
			'binary_adjacent_two_sentence_overlap_content_lemmas': 1,
			'adjacent_sentence_overlap_function_lemmas': 6,
			'adjacent_sentence_overlap_function_lemmas_normed': 2,
			'binary_adjacent_sentence_overlap_function_lemmas': 2,
			'adjacent_two_sentence_overlap_function_lemmas': 2,
			'adjacent_two_sentence_overlap_function_lemmas_normed': 1,
			'binary_adjacent_two_sentence_overlap_function_lemmas': 0,
			'adjacent_sentence_overlap_noun_lemmas': 4,
			'adjacent_sentence_overlap_noun_lemmas_normed': 2,
			'binary_adjacent_sentence_overlap_noun_lemmas': 2,
			'adjacent_two_sentence_overlap_noun_lemmas': 2,
			'adjacent_two_sentence_overlap_noun_lemmas_normed': 1,
			'binary_adjacent_two_sentence_overlap_noun_lemmas': 1,
			'adjacent_sentence_overlap_verb_lemmas': 1,
			'adjacent_sentence_overlap_verb_lemmas_normed': 1,
			'binary_adjacent_sentence_overlap_verb_lemmas': 0,
			'adjacent_two_sentence_overlap_verb_lemmas': 0,
			'adjacent_two_sentence_overlap_verb_lemmas_normed': 0,
			'binary_adjacent_two_sentence_overlap_verb_lemmas': 0,
			'adjacent_sentence_overlap_adjective_lemmas': 0,
			'adjacent_sentence_overlap_adjective_lemmas_normed': 0,
			'binary_adjacent_sentence_overlap_adjective_lemmas': 0,
			'adjacent_two_sentence_overlap_adjective_lemmas': 0,
			'adjacent_two_sentence_overlap_adjective_lemmas_normed': 0,
			'binary_adjacent_two_sentence_overlap_adjective_lemmas': 0,
			'adjacent_sentence_overlap_adverb_lemmas': 0,
			'adjacent_sentence_overlap_adverb_lemmas_normed': 0,
			'binary_adjacent_sentence_overlap_adverb_lemmas': 0,
			'adjacent_two_sentence_overlap_adverb_lemmas': 0,
			'adjacent_two_sentence_overlap_adverb_lemmas_normed': 0,
			'binary_adjacent_two_sentence_overlap_adverb_lemmas': 0
		}]
	},
]


const ResultsCoh = () => {
	const [cohesionResult, setCohesionResult] = useState([]);
	const [selectedFile, setSelectedFile] = useState(-1);

	// useEffect(() => {
	// 	fetch('http://localhost:8000/korcat/cohesion')
	// 		.then(response => response.text())
	// 		.then(data => setCohesionResult(data))
	// 		.catch(error => console.error(error));
	// }, []);

	useEffect(() => {
		setCohesionResult(dummy_cohes);
	}, []);

	const handleFileDownload = () => {
		console.log('Download');
	}

	const handleSelectFile = (index) => {
		return () => {
			console.log(index);
			selectedFile === index ? setSelectedFile(-1) : setSelectedFile(index);
		}
	}

	return (
		<div className='grid grid-cols-1 gap-4 fade-in'>
			<h2 className="text-3xl font-bold py-2">Cohesion Results</h2>

			{cohesionResult.map((item, index) => (
				<div key={index} className='p-2 border border-gray-300 rounded-lg overflow-auto w-full relative bg-slate-50'>
					<div className='grid grid-cols-1 gap-4'>
						<h3 className='text-xl font-bold'>{item.filename}</h3>
						<p>{item.contents}</p>
						<div className=''>{item.results.map((result, index) => (
							<div key={index} className={`${selectedFile === index ? 'h-96 overflow-scroll' : 'h-0 overflow-hidden'} transition-all ease-in-out pr-2`}>
								<table className='w-full'>
									<thead>
										<tr className='text-left border-b'>
											<th className='p-1'></th>
											<th className='p-1'>Property</th>
											<th className='p-1'>Value</th>
										</tr>
									</thead>
									<tbody>
										{Object.entries(result).map(([key, value]) => (
											<tr key={key} className='border-b'>
												<td className='p-1'>
													<input type="checkbox" id={key} name={key} value={key} />
												</td>
												<td className='p-1'>
													<label htmlFor={key}>{key}</label>
												</td>
												<td className='p-1'>
													{value}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}</div>
					</div>

					<div className='absolute top-2 right-2 flex gap-2 text-sm'>
						<button className={`grow sm:grow-0 px-4 py-2 bg-slate-500 text-white rounded-full hover:bg-slate-600 flex flex-nowrap gap-2`}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
							</svg>
							Download
						</button>

						<button className={`grow sm:grow-0 p-2 rounded-full hover:bg-slate-200 transition-all ease-in-out ${selectedFile === index ? 'rotate-90' : ''}`} onClick={handleSelectFile(index)}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
								<path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
							</svg>
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

export default ResultsCoh;
