import React, { useEffect, useState } from 'react';
import dummy from '../dummy';


const ResultsMor = () => {
	const [morphemeResult, setMorphemeResult] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch('http://localhost:8000/korcat/morpheme');
				const data = await response.json();
				setMorphemeResult(data);
			} catch (error) {
				console.error(error);
			}
		};

		fetchData();
	}, []);

	return (
		<div className='grid grid-cols-1 gap-4 fade-in'>
			<h2 className="text-3xl font-bold py-2">Morpheme Results</h2>

			{morphemeResult.map((item, index) => (
				<div className='p-2 border border-gray-300 rounded overflow-auto w-full'>
					<div key={index} className='mb-2'>
						<h3 className='text-xl font-bold'>{item.filename}</h3>
						<p>{item.contents}</p>
						<div className='flex'>
							{item.results.map((morph, index) => {
								return (
									<div key={index} className='text-sm font-bold flex-col'>
										<div>{morph[0]}</div>
										<div>{morph[1]}</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default ResultsMor;
