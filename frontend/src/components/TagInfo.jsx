import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { MorphTags } from "./Tags";



const TagInfo = () => {
	const [tags, setTags] = useState([]);

	useEffect(() => {
		setTags(MorphTags);
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0, x: 100 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -100 }}
			transition={{ duration: 0.1 }}
			className='grid grid-cols-1 gap-4'
		>
			<h2 className="text-2xl font-bold py-2">Morpheme Tags</h2>

			<div className="rounded-xl w-full shadow overflow-hidden text-center">
				<table className="w-full text-sm">
					<thead className="border-b-[1px] table-header">
						<tr className="*:py-2 *:px-3">
							<th className="">Tag Color</th>
							<th className="">Tag</th>
							<th className="">Description (KR)</th>
							<th className="">Description</th>
						</tr>
					</thead>

					<tbody className="table-contents dark:bg-slate-800">
						{tags.filter(tag => tag.color !== "#000000").map((tag) => (
							<tr key={tag.tag} className="">
								<td
									className="px-3 py-1 font-mono italic text-white"
									style={{
										backgroundColor: tag.color,
									}}
								>
									{tag.color}
								</td>
								<td className="px-3 py-1 font-mono">{tag.tag}</td>
								<td className="px-3 py-1">{tag.desc}</td>
								<td className="px-3 py-1">{tag.desc_eng}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</motion.div>
	);
};


export default TagInfo;