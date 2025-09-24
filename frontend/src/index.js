import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { BatchDownloadProvider } from './contexts/BatchDownloadContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { LanguageProvider } from './contexts/LanguageContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<LoadingProvider>
				<BatchDownloadProvider>
					<LanguageProvider>
						<App />
					</LanguageProvider>
				</BatchDownloadProvider>
			</LoadingProvider>
		</BrowserRouter>
	</React.StrictMode>
);
