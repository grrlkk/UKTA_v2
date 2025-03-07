import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { CompareFilesProvider } from './components/contexts/ComparisonContext';
import { BatchDownloadProvider } from './components/contexts/BatchDownloadContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<BatchDownloadProvider>
				<CompareFilesProvider>
					<App />
				</CompareFilesProvider>
			</BatchDownloadProvider>
		</BrowserRouter>
	</React.StrictMode>
);
