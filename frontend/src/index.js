import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { BatchDownloadProvider } from './components/contexts/BatchDownloadContext';
import { LoadingProvider } from './components/contexts/LoadingContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<LoadingProvider>
				<BatchDownloadProvider>
					<App />
				</BatchDownloadProvider>
			</LoadingProvider>
		</BrowserRouter>
	</React.StrictMode>
);
