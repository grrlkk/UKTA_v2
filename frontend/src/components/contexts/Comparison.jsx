import React, { createContext, useState, useContext } from 'react';

// Create a context for the selected files
const SelectedFilesContext = createContext();

// Create a provider component
export const SelectedFilesProvider = ({ children }) => {
	const [selectedFiles, setSelectedFiles] = useState([]);

	return (
		<SelectedFilesContext.Provider value={{ selectedFiles, setSelectedFiles }}>
			{children}
		</SelectedFilesContext.Provider>
	);
};

// Custom hook to use the SelectedFilesContext
export const useSelectedFiles = () => {
	return useContext(SelectedFilesContext);
};