## /home/ukta/KorCAT-web_v2/backend/apps/morph/utagger.py
import apps.morph.bareun as br
import pandas as pd
from pathlib import Path
import sys

# import pyutagger.downloader as ud
try:
    import pyutagger.utagger as ut
    PYUTAGGER_AVAILABLE = True
except SystemExit as e:
    # pyutagger는 설정 파일이 없으면 sys.exit(1)을 호출하므로 여기서 삼킨다.
    print(f"Warning: pyutagger not available (config load failed): {e}", file=sys.stderr)
    PYUTAGGER_AVAILABLE = False
    ut = None
except Exception as e:
    print(f"Warning: pyutagger not available (macOS not supported): {e}", file=sys.stderr)
    PYUTAGGER_AVAILABLE = False
    ut = None

# ud.install_utagger("utagger3")  # 유태거 3
# ud.install_utagger("utagger4")  # 유태거 4
# ud.install_utagger("utagger4hj")  # 유태거 4 훈민정음(옛한글 전용)


class utagger:
    def __init__(self):
        if not PYUTAGGER_AVAILABLE or ut is None:
            raise RuntimeError("pyutagger is not available on this system (macOS not supported)")

        self.utg4 = ut.utagger_loader("utagger4")
        self.utg4.load()
        if not self.utg4:
            raise RuntimeError("Failed to load utagger4 model")

        WORD_GRADES = Path(__file__).parent / "word_grades.csv"
        self.word_grades = pd.read_csv(WORD_GRADES)
        # ['grade', 'vocab', 'homonym_num', 'pos', 'type', 'original', 'meaning', 'field']

    def morphs(self, text):
        return self.utg4.morphs(text)

    def nouns(self, text):
        return self.utg4.nouns(text)

    def pos(self, text):
        try:
            pos = self.utg4.pos(text)
        except:
            br_inf = br.bareun()
            pos = br_inf.pos(text)
        return pos

    def grade(self, text=None, pos=None):
        if pos is None:
            pos = self.pos(text)
        grades = []
        for word in pos:
            split_word = word[0].split("__")
            voc = split_word[0]
            hyn = split_word[1] if len(split_word) > 1 else 0

            if word[1].startswith("S") or word[1].startswith("E"):
                continue

            row = self.word_grades[
                (self.word_grades["vocab"] == voc)
                & (self.word_grades["homonym_num"] == int(hyn))
            ]
            if row.empty:
                row = self.word_grades[
                    (self.word_grades["vocab"] == voc + "다")
                    & (self.word_grades["homonym_num"] == int(hyn))
                ]

            if row.empty:
                grades.append(
                    {
                        "voc": word[0],
                        "pos_tagged": word[1],
                        "pos": "",
                        "type": "",
                        "meaning": "Not Found in Dictionary",
                        "field": "",
                        "grade": -1,
                    }
                )
                continue

            if str(row["pos_tag"].values[0]) not in word[1]:
                grades.append(
                    {
                        "voc": word[0],
                        "pos_tagged": word[1],
                        "pos": "",
                        "type": "",
                        "meaning": "Morpheme POS MisMatch",
                        "field": "",
                        "grade": -1,
                    }
                )
                continue

            grade = row["grade"].values[0]
            grade = int(grade.split("등급")[0])
            grades.append(
                {
                    "voc": word[0],
                    "grade": grade,
                    "pos_tagged": word[1],
                    "pos": row["pos"].values[0],
                    "type": row["type"].values[0],
                    "meaning": row["meaning"].values[0],
                    "field": row["field"].values[0],
                }
            )
        return grades
