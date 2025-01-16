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
						${expanded ? 'btn-red' : 'btn-primary bottom-4'} 
						absolute right-4 bg-opacity-80 backdrop-blur p-2
						transition-all ease-in-out`
					}
					onClick={() => setExpanded(!expanded)}
				>
					{expanded ? 
						'Close' :
						`Compare ${compareFiles.length} files`
					}
				</button>
				{expanded && (
					<div className="expanded-content">
						{compareFiles.length > 0 ? (
							<EvalFormatCompare
								result={
									compareFiles.map(file => ({ ...file.results.essay_score, filename: file.filename }))
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