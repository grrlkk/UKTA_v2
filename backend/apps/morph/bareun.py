import ast
import json
import sys
import os 

import google.protobuf.text_format as tf
import pandas as pd
from bareunpy import Tagger
from bareunpy import Corrector

API_KEY_PATH = "/home/ukta/KorCAT-web_v2/bareun_api.txt"

def load_api_key(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        print(f"API 키 파일을 읽는 중 오류 발생: {e}")
        return ""

API_KEY = load_api_key(API_KEY_PATH)

tagger = Tagger(API_KEY, "localhost", 5656)
corrector = Corrector(API_KEY, "localhost", 5656)

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
    
    def correction(self, text):
        return corrector.correct_error(content=text, auto_split=True)
    
    def corrections(self, text):
        return corrector.correct_error_list(contents=text, auto_split=True)