import React, { useEffect, useState } from "react";

import Tags from "./Tags";



const TagInfo = () => {
	const [tags, setTags] = useState([]);

	useEffect(() => {
		setTags(Tags);
	}, []);

	return (
		<div className='grid grid-cols-1 gap-4'>
			<h2 className="text-3xl font-bold py-2">품사 태깅표</h2>

			<div className="p-4 border border-gray-300 rounded-lg w-full bg-slate-100 shadow">
				<table className="text-left w-full">
					<thead className="border-b-[1px] border-slate-300">
						<tr>
							<th className="px-3 py-1">태그</th>
							<th className="px-3 py-1">태그 설명</th>
							<th className="px-3 py-1">지정 색</th>
						</tr>
					</thead>
					<tbody className="">
						{tags.map((tag) => (
							<tr key={tag.tag} className="border-b-[1px] border-dotted border-slate-300">
								<td className="px-3 py-1">{tag.tag}</td>
								<td className="px-3 py-1">{tag.desc}</td>
								<td className="px-3 py-1" style={{ backgroundColor: tag.color }}>{tag.color}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};


export default TagInfo;