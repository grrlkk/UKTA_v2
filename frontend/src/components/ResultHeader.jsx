import React from 'react';


const ResultHeader = ({ title, content, trunc, date, procTime }) => {
	return (
		<>
			<h3 className='text-lg font-bold truncate'>{title}</h3>
			<p className={`${trunc ? "truncate text-slate-600" : ""}`}>{content}</p>
			{!trunc &&
				<div className='text-slate-600 text-sm'>
					<p className=''>Upload Date: {new Date(date).toLocaleString("ko-KR", {timeZone: "Asia/Seoul"})}</p>
					<p className=''>Process Time: {procTime}</p>
				</div>
			}
		</>
	);
}

export default ResultHeader;