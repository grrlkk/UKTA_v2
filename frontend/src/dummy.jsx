import React from "react"


const dummy = [
	{
		"morph": [
			{
				"filename": "test.txt",
				"contents": "This is a test file",
				"results": [
					["This", "DT"],
					["is", "VBZ"],
					["a", "DT"],
					["test", "NN"],
					["file", "NN"]
				]
			},
			{
				"filename": "test2.txt",
				"contents": "This is a test file",
				"results": [
					["This", "DT"],
					["is", "VBZ"],
					["a", "DT"],
					["test", "NN"],
					["file", "NN"]
				]
			}
		], 
		"cohes": [
			{
				"filename": "test.txt",
				"contents": "This is a test file",
				"results": "This is a test file"
			},
			{
				"filename": "test2.txt",
				"contents": "This is a test file",
				"results": "This is a test file"
			}
		]
	}
]

export default dummy