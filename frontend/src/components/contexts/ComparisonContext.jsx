import React, { createContext, useState, useContext } from 'react';

const CompareFilesContext = createContext();


export const CompareFilesProvider = ({ children }) => {
	const [compareFilesIdx, setCompareFilesIdx] = useState([]);
	const [compareFiles, setCompareFiles] = useState([]);
	const clearCompareFiles = () => {
		setCompareFiles([]);
	};
	const addCompareFile = async (file) => {
		if (!compareFilesIdx.includes(file)) {
			if (compareFiles.length >= 5) {
				console.warn('Maximum of 5 files can be compared at a time.');
				return;
			}
			const data = await fetchData(file);
			setCompareFiles([...compareFiles, data]);
			setCompareFilesIdx([...compareFilesIdx, file]);
		} else {
			setCompareFiles(compareFiles.filter((item) => item._id !== file));
			setCompareFilesIdx(compareFilesIdx.filter((item) => item !== file));
		}
	};

	const fetchData = async (resultId) => {
		try {
			const response = await fetch(`${process.env.REACT_APP_API_URI}/korcat/cohesion/${resultId}`);
			const data = await response.json();
			return data;
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<CompareFilesContext.Provider value={{ compareFiles, addCompareFile, clearCompareFiles }}>
			{children}
		</CompareFilesContext.Provider>
	);
};

export const useCompareFiles = () => {
	return useContext(CompareFilesContext);
};