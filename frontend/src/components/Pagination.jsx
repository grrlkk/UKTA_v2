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
	}

	if (componentArray.length === 0) {
		return (
			<div className='flex h-96'>
				<h2 className="text-2xl font-bold py-2 flex gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[28px] h-[28px] animate-spin">
						<path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
					</svg>
					Input Korean text for analysis!
				</h2>
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
				<div className='flex flex-wrap gap-2 justify-center mt-12'>
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