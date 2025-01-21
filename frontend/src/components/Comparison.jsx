import React, { useState } from 'react';

import { EvalFormatCompare } from './cohesion/EvalFormat';
import { useCompareFiles } from './contexts/ComparisonContext';


const Comparison = () => {
	const [expanded, setExpanded] = useState(false);
	const { compareFiles, addCompareFile, clearCompareFiles } = useCompareFiles();

	return (
		<div
			className={`
				fixed w-full bottom-0 
				flex justify-center
			`}
		>
			<div
				className={`
						flex max-w-6xl mx-auto px-4
						w-full rounded-t-xl relative transition-all
						${expanded ?
						'py-4 bg-opacity-40 bg-slate-100 dark:bg-slate-900 backdrop-blur shadow' :
						''
					}
					`}
			>
				<button
					className={`
						${expanded ? 'top-0 right-0 hover:btn-red hover:p-1 p-1' : 'btn-primary bottom-4 right-4'} 
						absolute bg-opacity-80
						transition-all ease-in-out z-20`
					}
					onClick={() => setExpanded(!expanded)}
				>
					{expanded ?
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg> :
						`Compare ${compareFiles.length} files`
					}
				</button>
				{expanded && (
					<div className="w-full">
						{compareFiles.length > 0 ? (
							<EvalFormatCompare
								result={
									compareFiles.map(file => ({ ...file.results.essay_score, filename: file.filename, _id: file._id }))
								}
							/>
						) : (
							<div className="p-4">
								<p className="text-lg font-bold">No files selected for comparison</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Comparison;