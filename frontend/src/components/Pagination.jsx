import React, { useState } from 'react';

const Pagination = ({ componentArray }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = componentArray.slice(indexOfFirstItem, indexOfLastItem);
	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	return (
		<div className='grid grid-cols-1 gap-2'>
			<div className='flex gap-2 justify-end mb-4'>
				{componentArray.length > itemsPerPage &&
					Array.from({ length: Math.ceil(componentArray.length / itemsPerPage) }, (_, index) => (
						<button
							className={`
								${index === currentPage - 1 ?
									'bg-slate-500 text-slate-100' :
									'bg-transparent text-black hover:bg-slate-600 hover:text-slate-100'}
								px-4 py-2 rounded-full flex flex-nowrap gap-2
							`}
							key={index}
							onClick={() => paginate(index + 1)}
						>
							{index + 1}
						</button>
					))}
			</div>

			{currentItems.map((component, index) => (
				<div key={index}>
					{component}
				</div>
			))}
		</div>
	);
};

export default Pagination;