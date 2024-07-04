import ast
import json
import sys

import google.protobuf.text_format as tf
import pandas as pd
from bareunpy import Tagger

API_KEY = "koba-QUS4QWA-2ASEQVQ-U55HLPY-R2E5UOA"
tagger = Tagger(API_KEY, "localhost", 5757)


class bareun:
	def __init__(self):
		pass

	def morphs(self, text):
		return tagger.morphs(text)

	def nouns(self, text):
		return tagger.nouns(text)

	def pos(self, text):
		return tagger.pos(text)
	
	def tag(self, text):
		return tagger.tag(text)
	
	def tags(self, text):
		return tagger.tags(text)
