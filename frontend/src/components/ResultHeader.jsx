import React from 'react';


const ResultHeader = ({ title, content, trunc }) => {
	return (
		<>
			<h3 className='text-lg font-bold truncate'>{title}</h3>
			<p className={`${trunc ? "truncate text-slate-600" : ""}`}>{content}</p>
		</>
	);
}

export default ResultHeader;