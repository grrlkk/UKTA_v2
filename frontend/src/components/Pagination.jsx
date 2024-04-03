import React, { useState } from 'react';

const Pagination = ({ componentArray }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = componentArray.slice(indexOfFirstItem, indexOfLastItem);
	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	return (
		<div className='grid grid-cols-1 gap-3'>
			{currentItems.map((component, index) => (
				<div key={index}>
					{component}
				</div>
			))}

			{componentArray.length > itemsPerPage &&
				<div className='flex gap-2 justify-center mt-12'>
					{Array.from({ length: Math.ceil(componentArray.length / itemsPerPage) }, (_, index) => (
						<button
							className={`
								${index === currentPage - 1 ?
									'font-bold' :
									'bg-transparent'}
								btn-primary p-2 rounded-full
							`}
							key={index}
							onClick={() => paginate(index + 1)}
						>
							{index + 1}
						</button>
					))}
				</div>
			}
		</div>
	);
};

export default Pagination;