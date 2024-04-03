import React, { useState } from "react";

import Tags from "./Tags";


const HilightText = ({ range, offset, content, color }) => {
	return (
		<div className="">
			<span>{content.substring(0, range[0] - offset)}</span>
			<span
				className="bg-slate-300 font-bold border-y-2"
				style={{ color: color, borderColor: color }}
			>
				{content.substring(range[0] - offset, range[1] - offset)}
			</span>
			<span>{content.substring(range[1] - offset, content.length)}</span>
		</div>
	);
}

const ToggleTable = ({ tableHidden, setTableHidden, index }) => {
	return (
		<button
			className="btn-primary rounded-full flex gap-1 p-1 items-center"
			onClick={() => setTableHidden(tableHidden.map((item, i) => i === index ? !item : item))}
		>
			<div className={`px-2 rounded-full ${tableHidden[index] ? "bg-slate-300 hover:bg-slate-500 text-slate-800" : ""}`}>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
					<path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
				</svg>
			</div>
			<div className={`px-2 rounded-full ${!tableHidden[index] ? "bg-slate-300 hover:bg-slate-500 text-slate-800" : ""}`}>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
					<path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
				</svg>
			</div>
		</button>
	);
}

const Sentence = ({ result, content }) => {
	const [range, setRange] = useState([0, 0]);
	const [hoverColor, setHoverColor] = useState('');
	const [tableHidden, setTableHidden] = useState(new Array(result.length).fill(true));
	const handleMouseEnter = (range) => {
		setRange(range);
	}

	return (
		<div className='grid grid-cols-1 gap-4'>
			{result.map((sentence, index) => {
				return (
					<div key={index} className="flex flex-col gap-2">
						<div className="flex gap-2">
							<div className="">{index + 1}.</div>
							<HilightText range={range} offset={sentence[0][0][0]} content={content.substring(sentence[0][0][0], sentence[sentence.length - 1][0][1])} color={hoverColor} />
						</div>

						<div className="flex flex-col bg-slate-300 dark:bg-slate-900 rounded-xl overflow-hidden font-semibold">
							<div className="flex gap-2 m-2 mb-0 items-center">
								<ToggleTable tableHidden={tableHidden} setTableHidden={setTableHidden} index={index} />
								<hr className="grow" />
							</div>

							<div
								className={`
									flex overflow-x-auto 
									bg-slate-200 dark:bg-slate-950 
									divide-x-[1px] divide-slate-300 dark:divide-slate-600 
									${tableHidden[index] ? "h-fit mt-2" : "h-0 pt-0 m-0"}
								`}
							>
								{sentence.map((morph, index) => {
									return (
										<div key={index}>
											{morph[2][7] != null ? (
												<div
													key={index + morph[1]}
													id={`${morph[1]}`}
													className={`group hover:bg-slate-300 dark:hover:bg-slate-700 relative text-sm flex-col whitespace-nowrap`}
												>
													<div className="flex">
														{String(morph[2][7]).split("+").map((mmorph, index) => {
															return (
																<div
																	onMouseEnter={() => {
																		handleMouseEnter(morph[0]);
																		setHoverColor(Tags.find(tag => tag.tag === mmorph.split("/")[1])?.color);
																	}}
																	onMouseLeave={() => {
																		setRange([0, 0]);
																		setHoverColor('');
																	}}
																	className='p-2' key={mmorph}
																>
																	<div className='flex justify-center'>
																		{mmorph.split("/")[0]}
																	</div>
																	<div className='flex flex-col justify-center group-hover:gap-1 text-xs gap-1' style={{ "color": Tags.find(tag => tag.tag === mmorph.split("/")[1])?.color }}>
																		<span key={index} className='flex justify-center'>
																			{mmorph.split("/")[1]}
																		</span>
																		<span className='flex justify-center'>
																			{Tags.find(tag => tag.tag === mmorph.split("/")[1])?.desc}
																		</span>
																	</div>
																</div>
															);
														})}
													</div>
												</div>) : (
												<div
													onMouseEnter={() => {
														handleMouseEnter(morph[0]);
														setHoverColor(Tags.find(tag => tag.tag === morph[2][0])?.color);
													}}
													onMouseLeave={() => {
														setRange([0, 0]);
														setHoverColor('');
													}}
													key={index + morph[1]}
													id={`${morph[1]}`}
													className={`group hover:bg-slate-300 dark:hover:bg-slate-700 relative text-sm flex-col whitespace-nowrap p-2`}
												>
													<div className='flex justify-center'>
														{morph[1]}
													</div>
													<div className='flex flex-col justify-center group-hover:gap-1 text-xs gap-1' style={{ "color": Tags.find(tag => tag.tag === morph[2][0])?.color }}>
														<span className='flex justify-center'>
															{morph[2][0]}
														</span>
														<span className='flex justify-center'>
															{Tags.find(tag => tag.tag === morph[2][0])?.desc}
														</span>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>

							<div className={`text-left overflow-hidden transition-all ease-in-out text-sm ${tableHidden[index] ? "h-0 pt-0" : "h-fit pt-1"}`}>
								<div className="table-header w-full py-1 overflow-y-scroll">
									<table className="table-auto w-full">
										<thead className="">
											<tr className="">
												<th className="px-3 text-right w-1/12">n.</th>
												<th colSpan={2} className="px-3">품사</th>
												<th className="px-3 w-1/6">태그</th>
												<th className="px-3 w-1/3">태그 설명</th>
											</tr>
										</thead>
									</table>
								</div>

								<div className="table-contents overflow-x-hidden overflow-y-scroll max-h-96 w-full">
									<table className="table-auto w-full">
										{sentence.map((morph, index) => {
											return (
												<tbody key={index} className="">
													{morph[2][7] != null ?
														<>
															{String(morph[2][7]).split("+").map((mmorph, index_) => {
																return (
																	<tr
																		onMouseEnter={() => {
																			handleMouseEnter(morph[0]);
																			setHoverColor(Tags.find(tag => tag.tag === mmorph.split("/")[1])?.color);
																		}}
																		onMouseLeave={() => {
																			setRange([0, 0]);
																			setHoverColor('');
																		}}
																		key={index_} className={``}>
																		{index_ === 0 ?
																			<>
																				<td rowSpan={String(morph[2][7]).split("+").length} className="px-3 py-1 font-mono italic text-right w-1/12">
																					{index + 1}
																				</td>
																				<td rowSpan={String(morph[2][7]).split("+").length} className="px-3 py-1 font-mono">
																					{morph[1]}
																				</td>
																			</>
																			: null}
																		<td className="px-3 py-1">{mmorph.split("/")[0]}</td>
																		<td
																			className="px-3 py-1 font-mono w-1/6"
																			style={{ "color": Tags.find(tag => tag.tag === mmorph.split("/")[1])?.color }}
																		>
																			{mmorph.split("/")[1]}
																		</td>
																		<td
																			className="px-3 py-1 w-1/3"
																			style={{ "color": Tags.find(tag => tag.tag === mmorph.split("/")[1])?.color }}
																		>
																			{Tags.find(tag => tag.tag === mmorph.split("/")[1])?.desc}
																		</td>
																	</tr>
																);
															})}
														</> :
														<tr
															onMouseEnter={() => {
																handleMouseEnter(morph[0]);
																setHoverColor(Tags.find(tag => tag.tag === morph[2][0])?.color);
															}}
															onMouseLeave={() => {
																setRange([0, 0]);
																setHoverColor('');
															}}
															key={index} className="">
															<td className="px-3 py-1 font-mono text-right w-1/12 italic">{index + 1}</td>
															<td colSpan={2} className="px-3 py-1 font-mono">{morph[1]}</td>
															<td
																className="px-3 py-1 font-mono w-1/6"
																style={{ "color": Tags.find(tag => tag.tag === morph[2][0])?.color }}
															>
																{morph[2][0]}
															</td>
															<td
																className="px-3 py-1 w-1/3"
																style={{ "color": Tags.find(tag => tag.tag === morph[2][0])?.color }}
															>
																{Tags.find(tag => tag.tag === morph[2][0])?.desc}
															</td>
														</tr>
													}
												</tbody>
											);
										})}
									</table>
								</div>
							</div>
						</div>
					</div>
				)
			})}
		</div >

	);
}

export default Sentence;