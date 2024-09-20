import React from 'react';


const OriginalText = ({ content, trunc, date, procTime }) => {
	return (
		<div className='flex flex-col gap-2 text-sm'>
			<div className='leading-relaxed'>
				{content.split('\n').map((line, index) => (
					<p key={index} className={`${trunc ? "truncate text-slate-600" : ""}`}>
						{line}
					</p>
				)).slice(0, trunc ? 1 : content.length)}
			</div>

			{!trunc &&
				<div className='text-slate-600 text-xs'>
					<p className=''>Upload Date: {new Date(date).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
					<p className=''>Process Time: {procTime}</p>
				</div>
			}
		</div>
	);
}

export default OriginalText;