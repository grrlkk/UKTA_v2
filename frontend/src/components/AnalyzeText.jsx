import React, { useState } from 'react';


const AnalyzeText = ({ currentPage }) => {
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

			<div className='grid grid-cols-1 gap-4'>
				<h2 className="text-3xl font-bold py-2">Text Input</h2>

				<div className='w-full'>
					<textarea
						value={inputValue}
						onChange={handleInputChange}
						className="p-2 border border-gray-300 rounded overflow-auto w-full"
						placeholder="Enter text"
					></textarea>
				</div>

				<div className='flex justify-end gap-2 text-sm'>
					<input type="file"
						className="
							file:mr-4 file:py-2 file:px-4
							file:rounded-full file:border-0
							file:bg-slate-500 file:text-white
							hover:file:bg-slate-600 hover:file:text-white
							file:cursor-pointer
							bg-slate-100 hover:bg-slate-200 rounded-full flex-shrink-0 
						"
					/>

					<button className="flex-shrink-0 px-4 py-2 bg-slate-500 text-white rounded-full hover:bg-slate-600">
						Analyze
					</button>
				</div>
			</div>

			<div className='grid grid-cols-1 gap-4'>
				<h2 className="text-3xl font-bold py-2">Results</h2>

				<div className='p-2 border border-gray-300 rounded overflow-auto h-96'>results</div>

				<div className='flex justify-end text-sm gap-2'>
					<button className="flex-shrink-0 px-4 py-2 bg-slate-500 text-white rounded-full hover:bg-slate-600">
						Download
					</button>
				</div>
			</div>
		</div>
	);
};

export default AnalyzeText;
