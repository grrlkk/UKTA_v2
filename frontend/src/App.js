import './App.css';

import Nav from './components/Nav';
import Foot from './components/Foot';
import Home from './components/Home';


function App() {
	return (
		<div className="App text-slate-900 bg-white">
			<Nav />
			<Home />
			<Foot />
		</div>
	);
}

export default App;
