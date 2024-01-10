import React, { useEffect, useState } from 'react';

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
		<div className="App text-slate-900 bg-white transition-all ease-in-out">
			<Nav currentPage={currentPage} />
			<Home currentPage={currentPage} />
			<Foot />
		</div>
	);
}

export default App;
