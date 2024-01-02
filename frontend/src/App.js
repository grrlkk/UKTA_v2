import logo from './logo.svg';
import './App.css';

import Nav from './components/Nav';
import Foot from './components/Foot';


function App() {
	return (
		<div className="App">
			<Nav />
			<header className="App-header">
				<img src={logo} className="App-logo translate-x-90" alt="logo" />
				<p>
					Edit <code>src/App.js</code> and save to reload.
				</p>
				<a
					className="App-link"
					href="https://reactjs.org"
					target="_blank"
					rel="noopener noreferrer"
				>
					Learn React 안녕하세요
				</a>
			</header>
			<Foot />
		</div>
	);
}

export default App;
