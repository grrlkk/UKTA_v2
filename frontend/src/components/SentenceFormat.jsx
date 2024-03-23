import React, { useState } from "react";

import Tags from "./Tags";


const HilightText = ({ range, content }) => {
	return (
		<div className=" leading-snug">
			<span>{content.substring(0, range[0])}</span>
			<span className="bg-slate-300 font-bold">{content.substring(range[0], range[1])}</span>
			<span>{content.substring(range[1], content.length)}</span>
		</div>
	);
}

const Sentence = ({ result, content }) => {
	const [range, setRange] = useState([0, 0]);

	const handleMouseEnter = (range) => {
		setRange(range);
	}

	return (
		<div className='grid grid-cols-1 gap-6'>
			<HilightText range={range} content={content} />

			{result.map((sentence, index) => {
				return (
					<div key={index} className='flex gap-3 overflow-x-scroll'>
						{sentence.map((morph, index) => {
							return (
								<div
									key={index + morph[1]}
									id={`${morph[1]}`}
									className={`group hover:bg-slate-200 relative text-sm font-bold flex-col whitespace-nowrap p-2 border-x-2 mb-2`}
									onMouseEnter={() => handleMouseEnter(morph[0])}
									onMouseLeave={() => setRange([0, 0])}
								>
									{morph[2][7] != null ? (
										<div className='flex gap-3'>
											{String(morph[2][7]).split("+").map((mmorph, index) => {
												return (
													<div className='' key={mmorph}>
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
									) : (
										<>
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
										</>
									)}
								</div>
							);
						})}
					</div>
				)
			})}
		</div>

	);
}

export default Sentence;