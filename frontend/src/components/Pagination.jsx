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
		console.log(pageNumber * itemsPerPage - itemsPerPage);	
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
									'bg-transparent'}
								btn-primary p-3 rounded-full
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