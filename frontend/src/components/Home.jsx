import React, { useState } from 'react';


const Home = () => {
	const [inputValue, setInputValue] = useState('');

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};

	return (
		<div className="items-start pt-12 grid grid-cols-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className='mt-10 grid grid-cols-1'>
				<h1 className="text-4xl font-bold py-2">First element</h1>

				<textarea
					value={inputValue}
					onChange={handleInputChange}
					className="px-4 py-2 border border-gray-300 rounded mb-4 overflow-scroll"
					placeholder="Enter text"
				/>

				<button className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600">
					Get Started
				</button>
			</div>
		</div>
	);
};

export default Home;
