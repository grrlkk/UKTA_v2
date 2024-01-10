import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';

import Nav from './components/Nav';
import Foot from './components/Foot';
import Home from './components/Home';


function App() {
	const [currentPage, setCurrentpage] = useState(window.location.pathname);

	useEffect(() => {
		setCurrentpage(window.location.pathname);
		console.log(currentPage);
	});

	return (
		<Router>
			<div className="App text-slate-900 bg-white transition-all ease-in-out min-w-24">
				<Nav currentPage={currentPage} />

				<Routes>
					<Route path="/" element={<Home />} />
				</Routes>

				<Foot />
			</div>
		</Router>
	);
}

export default App;
