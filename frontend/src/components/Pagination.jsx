import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


const Pagination = ({ componentArray, setSelectedFile }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 7;

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = componentArray.slice(indexOfFirstItem, indexOfLastItem);

	function paginate(pageNumber) {
		setCurrentPage(pageNumber);
		setSelectedFile(pageNumber * itemsPerPage - itemsPerPage);
		// console.log(pageNumber * itemsPerPage - itemsPerPage);
	}

	if (componentArray.length === 0) {
		return (
			<div className='flex justify-center items-center h-96'>
				<div className='text-center'>
					<h2 className='text-2xl font-bold'>No data available</h2>
					<p className='text-gray-500'>Please upload a file to get started</p>
				</div>
			</div>
		);
	}

	return (
		<div className='grid grid-cols-1 gap-4'>
			<AnimatePresence mode='sync'>
				{currentItems.map((component, index) => (
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						key={index}
					>
						{component}
					</motion.div>
				))}
			</AnimatePresence>

			{componentArray.length > itemsPerPage &&
				<div className='flex gap-2 justify-center mt-12'>
					{Array.from({ length: Math.ceil(componentArray.length / itemsPerPage) }, (_, index) => (
						<button
							className={`
								${index === currentPage - 1 ?
									'font-bold' :
									'bg-opacity-50'}
								btn-primary p-3 rounded-full items-center justify-center
							`}
							key={index}
							onClick={() => paginate(index + 1)}
						>
							<div className='w-5 h-5 text-center text-sm'>
								{index + 1}
							</div>
						</button>
					))}
				</div>
			}
		</div>
	);
};

export default Pagination;