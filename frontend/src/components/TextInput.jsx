import React, { useState } from "react";
import { useLoadingContext } from "../contexts/LoadingContext";
import { LABELS } from "../labels";
import { useLanguage } from "../contexts/LanguageContext";

const TextInput = ({ uploadInProgress, setUploadInProgress }) => {
    const [inputValue, setInputValue] = useState('');
    // 'selectedFile'과 'files'를 'files' 하나로 통합하여 관리합니다.
    const [files, setFiles] = useState([]); 
    const { loading } = useLoadingContext();
    const { language } = useLanguage();

    // Function to handle the analysis process
    const handleAnalysis = async (type) => {
        setUploadInProgress(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        const formData = new FormData();

        // Append input text or files to formData
        if (inputValue.length > 0 && files.length <= 1) {
            formData.append("files", new Blob([inputValue], { type: "text/plain" }), files[0]?.name || "input.txt");
        } else if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                formData.append("files", files[i], files[i].name);
            }
        }

        try {
            // Send the formData to the server
            const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/${type}`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            // console.log(data);
        } catch (error) {
            console.error("Analysis Error:", error);
        } finally {
            setUploadInProgress(false);
            handleClearInput();
        }
    };

    // Function to handle changes in the input text area
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // Function to handle file input changes
    const handleFileInputChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles); // Update the files state

        if (selectedFiles.length === 1) {
            // If one file is selected, read its content into the textarea
            const reader = new FileReader();
            reader.onload = (event) => {
                setInputValue(event.target.result);
            };
            reader.readAsText(selectedFiles[0]);
        } else {
            // If multiple files or no files are selected, clear the textarea
            setInputValue('');
        }
    };

    // Function to clear the input and reset states
    const handleClearInput = () => {
        setInputValue('');
        setFiles([]); // Clear the files state
        // Reset the file input's value to allow selecting the same file again
        document.getElementById('fileInput').value = '';
    };

    return (
        <div className='grid grid-cols-1 gap-4'>
            {/* Defensive coding: Check if LABELS.input exists before accessing language property */}
            <h2 className="text-2xl font-bold py-2">{LABELS.input?.[language] || 'Text Input'}</h2>

            {/* Input text area */}
            <div className='grid grid-cols-1 gap-4 p-4 rounded-3xl bg-slate-100 dark:bg-slate-900 shadow'>
                <div className='flex justify-between gap-2 text-sm shrink'>
                    
                    {/* === Custom File Input UI Start === */}
                    <div className="relative flex items-center bg-slate-200 dark:bg-slate-800 rounded-xl grow sm:grow-0 shrink w-1/3 transition-all ease-in-out">
                        {/* 1. Visible button part (Label) */}
                        <label
                            htmlFor="fileInput"
                            className={`py-2 px-4 rounded-xl border-0 btn-primary whitespace-nowrap ${(uploadInProgress || loading) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                        >
                            {LABELS.choose_file?.[language] || 'Choose File'}
                        </label>

                        {/* 2. Display for selected file name(s) */}
                        <span className="pl-2 pr-4 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {files.length === 0 && (LABELS.not_file?.[language] || 'No file selected')}
                            {files.length === 1 && files[0].name}
                            {files.length > 1 && `${files.length} files selected`}
                        </span>

                        {/* 3. Hidden actual file input */}
                        <input
                            type="file"
                            id="fileInput"
                            accept=".txt"
                            onChange={handleFileInputChange}
                            className="hidden"
                            disabled={uploadInProgress || loading}
                            multiple
                        />
                    </div>
                    {/* === Custom File Input UI End === */}
                    {/* New Button 자리 */}
                    <button
                        className={`flex-shrink-0 flex gap-1 group btn-red`}
                        onClick={handleClearInput}
                        disabled={uploadInProgress || loading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-all ease-in-out group-hover:rotate-90">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                        {LABELS.reset?.[language] || 'Reset'}
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
                        placeholder={files.length > 1 ? 'You can only edit one file input.' : (LABELS.input_text?.[language] || 'Enter text or select a file.')}
                        spellCheck="false"
                        disabled={uploadInProgress || files.length > 1}
                    ></textarea>
                </div>
            </div>

            {/* Analysis button */}
            <div className='flex px-4 justify-end text-center gap-2 text-sm whitespace-nowrap'>
                {uploadInProgress ? (
                    <button className='btn-primary flex gap-1 grow sm:grow-0 cursor-not-allowed' disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-spin">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
                        </svg>
                        Analyzing...
                    </button>
                ) : loading ? (
                    <button className='btn-primary flex gap-1 grow sm:grow-0 cursor-not-allowed' disabled>
                        Loading...
                    </button>
                ) : (inputValue === '' && files.length === 0) ? (
                    <button className='btn-primary flex gap-1 grow sm:grow-0 justify-center cursor-not-allowed' disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-pulse">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
                        </svg>
                        {LABELS.input_kor?.[language] || 'Input Content'}
                    </button>
                ) : (
                    <button className={`grow sm:grow-0 btn-primary`} onClick={() => handleAnalysis('cohesion')}>
                        {LABELS.analysis?.[language] || 'Analyze'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TextInput;
