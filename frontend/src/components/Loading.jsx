import React from 'react';
import { motion } from 'framer-motion';


const Loading = () => {
	return (
		<motion.div
			initial={{ opacity: 0, x: 100 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -100 }}
			transition={{ duration: 0.1 }}
			className="mb-32"
		>
			<h2 className="text-3xl font-bold py-2 flex gap-2 align-middle animate-pulse">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[32px] h-[32px] animate-spin">
					<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
				</svg>
				Analyzing...
			</h2>
		</motion.div>
	);
};

export default Loading;
