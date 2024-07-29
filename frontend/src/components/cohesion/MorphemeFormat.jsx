import React, { useState } from "react";
import Tags from "../Tags";

const Sentence = ({ tokens, content, index }) => {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex gap-2">
				<div className="">{index + 1}.</div>
				<div className="font-normal">{content}</div>
			</div>

			<div className="flex flex-col bg-slate-300 dark:bg-slate-900 rounded-xl overflow-hidden font-semibold">
				<div
					className={`
						flex overflow-x-auto 
						bg-slate-200 dark:bg-slate-950 
						divide-x-[1px] divide-slate-300 dark:divide-slate-600 
						h-fit text-sm
					`}
				>
					{tokens.map((token, index) => {
						// console.log(token.morphemes)

						return (
							<div key={index} className="flex flex-row">
								{token.morphemes.map((morph, index_) => {
									return (
										<div
											key={index_}
											className={`
												flex flex-col gap-1 p-2 text-nowrap *:flex *:justify-center 
											`}
										>
											<div className="">
												{morph.text.content}
											</div>
											<div
												className=""
												style={{ "color": Tags.find(tag => tag.tag === morph.tag)?.color }}
											>
												{morph.tag}
											</div>
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

const MorphemeFormat = ({ result }) => {
	return (
		<div className='grid grid-cols-1 gap-4'>
			{result.map((sentence, index) => {
				return (
					<Sentence key={index} tokens={sentence.tokens} content={sentence.text.content} index={index} />
				)
			})}
		</div >

	);
}

export default MorphemeFormat;