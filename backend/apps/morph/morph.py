from mecab import MeCab

mecab_kr = MeCab()


class mecab:
    def __init__(self):
        pass

    def morphs(self, text):
        return mecab_kr.morphs(text)

    def nouns(self, text):
        return mecab_kr.nouns(text)

    def pos(self, text):
        return mecab_kr.pos(text)

    def parse(self, text):
        return mecab_kr.parse(text)
