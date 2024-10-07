import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


const TextInput = ({ uploadInProgress, setUploadInProgress }) => {
	const [inputValue, setInputValue] = useState('');
	const [selectedFile, setSelectedFile] = useState(null);
	const [files, setFiles] = useState([]);

	const navigate = useNavigate();

	const handleAnalysis = async (type) => {
		setUploadInProgress(true);
		await new Promise(resolve => setTimeout(resolve, 1000));
		const formData = new FormData();

		if (inputValue.length > 0) {
			formData.append("files", new Blob([inputValue], { type: "text/plain" }), inputValue.split(" ")[0] + "...");
		} else if (selectedFile) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				formData.append("files", file, file.name);
			}
		}

		try {
			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/${type}`, {
				method: 'POST',
				body: formData,
			});
			const data = await response.json();
			// console.log(data);
		} catch (error) {
			console.error(error);
		} finally {
			setUploadInProgress(false);
			handleClearInput();
			navigate(`/${type}`);
		}
	};

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};

	const handleFileInputChange = (e) => {
		const files = e.target.files;
		if (files.length === 0) return;
		else if (files.length === 1) {
			const file = files[0];
			setSelectedFile(file);

			const reader = new FileReader();
			reader.onload = (event) => {
				const fileContent = event.target.result;
				setInputValue(fileContent);
			};
			reader.readAsText(file);
		} else {
			setFiles(files);
			setInputValue('');
		}
	};

	const handleClearInput = () => {
		setInputValue('');
		setSelectedFile(null);
		document.getElementById('fileInput').value = '';
	};

	return (
		<div className='grid grid-cols-1 gap-4'>
			<h2 className="text-2xl font-bold py-2">Input Korean Text</h2>

			<div className='grid grid-cols-1 gap-4 p-4 rounded-3xl bg-slate-100 dark:bg-slate-900 shadow'>
				<div className='flex justify-between gap-2 text-sm shrink'>
					<input
						type="file" id="fileInput" accept=".txt" onChange={handleFileInputChange}
						className="	
							file:mr-4 file:py-2 file:px-4
							file:rounded-xl file:border-0 
							file:btn-primary
							file:cursor-pointer
							bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-xl grow sm:grow-0 shrink transition-all ease-in-out w-1/3
						"
						disabled={uploadInProgress}
						multiple
					/>

					<button
						className={`flex-shrink-0 flex gap-1 group btn-red`}
						onClick={() => handleClearInput()}
						disabled={uploadInProgress}
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-all ease-in-out group-hover:rotate-90">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg>
						Reset
					</button>
				</div>

				<div className='rounded-xl overflow-hidden bg-white dark:bg-black has-[:focus]:ring-2 has-[:focus]:ring-slate-500'>
					<textarea
						value={inputValue}
						onChange={handleInputChange}
						className={`
							p-2 overflow-y-auto rounded-xl transition-all ease-in-out w-full 
							${inputValue.length === 0 ? 'h-[4em] focus:h-32' : 'h-32'}
							focus:outline-none ring-0 dark:bg-black
						`}
						placeholder={files.length > 1 ? 'You can only edit one file input.' : 'Input Korean Text...'}
						spellCheck="false"
						disabled={uploadInProgress || files.length > 1}
					></textarea>
				</div>
			</div>

			<div className='flex justify-end text-center gap-2 text-sm whitespace-nowrap'>
				{uploadInProgress ?
					<button className='btn-primary flex gap-1 grow sm:grow-0 cursor-not-allowed'>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-spin">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
						</svg>
						Analyzing...
					</button> :
					(inputValue === '' && files.length === 0) ?
						<button className='btn-primary flex gap-1 grow sm:grow-0 justify-center cursor-not-allowed'>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-pulse">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
							</svg>
							Input Korean Text to Analyze
						</button> :
						<>
							<Link to='/loading' className={`grow sm:grow-0 btn-primary`} onClick={() => handleAnalysis('cohesion')}>
								Analyze Cohesion
							</Link>
							<Link to='/loading' className={`grow sm:grow-0 btn-primary`} onClick={() => handleAnalysis('morpheme')}>
								Analyze Morpheme
							</Link>
						</>}
			</div>
		</div>
	);
};

export default TextInput;