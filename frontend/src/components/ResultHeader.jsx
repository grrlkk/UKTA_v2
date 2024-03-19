import React from 'react';


const ResultHeader = ({ title, content, range }) => {
	return (
		<>
			<h3 className='text-lg font-bold truncate'>{title}</h3>
			<p className='truncate'>{content}</p>
		</>
	);
}

export default ResultHeader;