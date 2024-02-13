import React, { useEffect, useState } from 'react';


const ResultsCoh = () => {
	const [cohesionResult, setCohesionResult] = useState('');

	useEffect(() => {
		fetch('http://localhost:8000/korcat/cohesion')
			.then(response => response.text())
			.then(data => setCohesionResult(data))
			.catch(error => console.error(error));
	}, []);

	return (
		<div className='grid grid-cols-1 gap-4 fade-in'>
			<h2 className="text-3xl font-bold py-2">Cohesion Results</h2>

			<div className='p-2 border border-gray-300 rounded overflow-auto w-full'>
				{cohesionResult}
			</div>
		</div>
	);
};

export default ResultsCoh;
