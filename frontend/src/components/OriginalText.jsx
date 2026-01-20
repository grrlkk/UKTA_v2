import React from 'react';

const OriginalText = ({ content, topic, trunc, date, procTime }) => {
    return (
        <div className='flex flex-col gap-4 text-sm'>
            {/* 1. 주제(Topic) 영역: '발문' 라벨 */}
            {!trunc && topic && (
                <div className='flex flex-col'>
                    <div className='text-base font-bold text-black mb-3 uppercase tracking-tighter'>
                        발문
                    </div>
                    <div className='leading-relaxed text-slate-700 dark:text-slate-200 font-medium'>
                        {topic.split('\n').map((line, index) => (
                            <p key={`topic-${index}`}>
                                {line}
                            </p>
                        ))}
                    </div>
                    {/* 섹션 구분선 */}
                    <hr className="border-slate-200 dark:border-slate-800 mt-5 mb-2" />
                </div>
            )}

            {/* 2. 에세이 원문 영역: '입력 에세이' 라벨 */}
            <div className='flex flex-col'>
                {!trunc && (
                    <div className='text-base font-bold text-black mb-3 uppercase tracking-tighter'>
                        입력 에세이
                    </div>
                )}
                <div className='leading-relaxed'>
                    {content.split('\n').map((line, index) => (
                        <p key={`content-${index}`} className={`${trunc ? "truncate text-slate-600" : ""}`}>
                            {line}
                        </p>
                    )).slice(0, trunc ? 1 : content.length)}
                </div>
            </div>
        </div>
    );
}

export default OriginalText;

// import React from 'react';


// const OriginalText = ({ content, trunc, date, procTime }) => {
// 	return (
// 		<div className='flex flex-col gap-2 text-sm'>
// 			<div className='leading-relaxed'>
// 				{content.split('\n').map((line, index) => (
// 					<p key={index} className={`${trunc ? "truncate text-slate-600" : ""}`}>
// 						{line}
// 					</p>
// 				)).slice(0, trunc ? 1 : content.length)}
// 			</div>
// {/* 
// 			{!trunc &&
// 				<div className='text-slate-600 text-xs'>
// 					<p className=''>Upload Date: {new Date(date).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
// 					<p className=''>Process Time: {procTime}</p>
// 				</div>
// 			} */}
// 		</div>
// 	);
// }

// export default OriginalText;