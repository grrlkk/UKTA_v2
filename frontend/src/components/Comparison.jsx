import React, { useState } from 'react';

import { EvalFormatCompare } from './cohesion/EvalFormat';
import { useBatchDownloads } from './contexts/BatchDownloadContext';


const Comparison = () => {
	const { batchDownloads, addBatchDownload, clearBatchDownloads, handleBatchDownload, handleBatchDelete, compare, setCompare } = useBatchDownloads();

	return (
		<div
			className={`w-full flex justify-center`}
		>
			<div
				className={`
					flex max-w-6xl mx-auto px-4
					w-full rounded-3xl relative transition-all
					${compare ?
						'py-4 bg-opacity-40 bg-slate-100 dark:bg-slate-900 backdrop-blur shadow' : ''}
				`}
			>
				{compare && (
					<div className="w-full">
						{batchDownloads.length > 0 ? (
							<EvalFormatCompare
								result={
									batchDownloads.map(file => ({ ...file.results.essay_score, filename: file.filename, _id: file._id }))
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