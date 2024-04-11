import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import Tags from "./Tags";



const TagInfo = () => {
	const [tags, setTags] = useState([]);

	useEffect(() => {
		setTags(Tags);
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0, x: 100 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -100 }}
			transition={{ duration: 0.1 }}
			className='grid grid-cols-1 gap-4'
		>
			<h2 className="text-2xl font-bold py-2">품사 태깅표</h2>

			<div className="rounded-xl w-full shadow overflow-hidden text-center">
				<table className="w-full">
					<thead className="border-b-[1px] table-header">
						<tr className="*:py-2 *:px-3">
							<th className="">태그</th>
							<th className="">태그 설명</th>
							<th className="">지정 색</th>
						</tr>
					</thead>

					<tbody className="table-contents dark:bg-slate-800">
						{tags.map((tag) => (
							<tr key={tag.tag} className="">
								<td className="px-3 py-1 font-mono">{tag.tag}</td>
								<td className="px-3 py-1">{tag.desc}</td>
								<td
									className="px-3 py-1 font-mono italic text-white"
									style={{
										backgroundColor: tag.color,
									}}
								>
									{tag.color}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</motion.div>
	);
};


export default TagInfo;