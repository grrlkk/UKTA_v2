import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { CompareFilesProvider } from './components/contexts/ComparisonContext';
import { BatchDownloadProvider } from './components/contexts/BatchDownloadContext';
import { LoadingProvider } from './components/contexts/LoadingContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<LoadingProvider>
				<BatchDownloadProvider>
					<CompareFilesProvider>
						<App />
					</CompareFilesProvider>
				</BatchDownloadProvider>
			</LoadingProvider>
		</BrowserRouter>
	</React.StrictMode>
);
