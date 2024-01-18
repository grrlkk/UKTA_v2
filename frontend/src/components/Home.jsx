import React, { useState } from 'react';


const Home = ({ currentPage }) => {
	const [inputValue, setInputValue] = useState('');
	const [selectedFile, setSelectedFile] = useState(null);

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};

	const handleFileInputChange = (e) => {
		const file = e.target.files[0];
		setSelectedFile(file);
	};

	return (
		<div className="items-start pt-12 grid grid-cols-1 gap-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<h1 className="mt-10 text-4xl font-extrabold">{currentPage}</h1>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<a href='/morpheme' className='w-full aspect-[3/2] bg-slate-300 hover:bg-slate-500 hover:text-white font-extrabold px-4 py-2 rounded transition-all ease-in-out'>
					<h2 className="text-3xl py-2">형태소 분석</h2>
				</a>

				<a href='/morpheme' className='w-full aspect-[3/2] bg-slate-300 hover:bg-slate-500 hover:text-white font-extrabold px-4 py-2 rounded transition-all ease-in-out'>
					<h2 className="text-3xl py-2">자질 분석</h2>
				</a>
			</div>
		</div>
	);
};

export default Home;
