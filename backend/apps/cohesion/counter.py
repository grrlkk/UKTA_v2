import collections


def counter(text, sentences, words, kkma, kkma_list):
    result = collections.defaultdict()

    # counters ---------------------------------------------------------------------------
    charCnt = 0
    paraCnt = 0

    # morphs list ------------------------------------------------------------------------
    # (morph, tag, including sentence)
    morphLst_content = []
    morphLst_substansive = []
    morphLst_noun = []
    morphLst_NNG = []
    morphLst_NNP = []
    morphLst_NNB = []
    morphLst_NP = []
    morphLst_NP_people = []
    morphLst_NP_things = []
    morphLst_NR = []
    morphLst_verb = []
    morphLst_VV = []
    morphLst_VA = []
    morphLst_VX = []
    morphLst_VCP = []
    morphLst_VCN = []
    morphLst_mod = []
    morphLst_MM = []
    morphLst_MA = []
    morphLst_formal = []
    morphLst_J = []
    morphLst_E = []
    morphLst_X = []
    morphLst_IC = []

    # morphs -----------------------------------------------------------------------------
    morphs_content = [
        "NNG",
        "NNP",
        "NNB",
        "NNBC",
        "NP",
        "NR",
        "VV",
        "VA",
        "VX",
        "VCP",
        "VCN",
        "MM",
        "MAG",
        "MAJ",
        "IC",
        "XR",
    ]
    morphs_substansive = ["NNG", "NNP", "NNB", "NNBC", "NP", "NR"]  # 체언
    morphs_noun = ["NNG", "NNP", "NNB", "NNBC"]  # 명사
    morphs_NP_people = [
        "나",
        "저",
        "우리",
        "저희",
        "너",
        "너희",
        "당신",
        "그대",
        "그",
        "그들",
        "이들",
        "저들",
        "자기",
        "저",
        "당신",
        "누구",
        "아무",
    ]
    morphs_NP_things = [
        "이",
        "이것",
        "여기",
        "이리",
        "저",
        "저것",
        "저기",
        "저리",
        "그",
        "그것",
        "거기",
        "그곳",
        "그리",
        "무엇",
        "어디",
        "아무것",
        "아무데",
    ]
    morphs_verb = ["VV", "VA", "VX", "VCP", "VCN"]
    morphs_mod = ["MM", "MAG", "MAJ"]
    morphs_MA = ["MAG", "MAJ"]
    morphs_formal = [
        "JKS",
        "JKC",
        "JKG",
        "JKO",
        "JKB",
        "JKV",
        "JC",
        "JX",
        "EP",
        "EF",
        "EC",
        "ETN",
        "ETM",
        "XPN",
        "XSN",
        "XSV",
        "XSA",
    ]
    morphs_J = ["JKS", "JKC", "JKG", "JKO", "JKB", "JKV", "JX", "JC"]
    morphs_E = ["EP", "EF", "EC", "ETN", "ETM"]
    morphs_X = ["XPN", "XSN", "XSV", "XSA"]

    # counting ---------------------------------------------------------------------------
    for i in range(len(text)):
        if "\uAC00" <= text[i] <= "\uD7AF":
            charCnt += 1
        if text[i] == "\n" or i == len(text) - 1:
            paraCnt += 1

    for i in range(len(kkma_list)):
        for pos in kkma_list[i]:
            if pos[1] in morphs_content:
                morphLst_content.append((pos[0], pos[1], sentences[i]))
                if pos[1] in morphs_substansive:  # 체언
                    morphLst_substansive.append((pos[0], pos[1], sentences[i]))
                    if pos[1] in morphs_noun:
                        morphLst_noun.append((pos[0], pos[1], sentences[i]))
                        if pos[1] == "NNG":
                            morphLst_NNG.append((pos[0], pos[1], sentences[i]))
                        elif pos[1] == "NNP":
                            morphLst_NNP.append((pos[0], pos[1], sentences[i]))
                        elif pos[1] == "NNB" or pos[1] == "NNBC":
                            morphLst_NNB.append((pos[0], pos[1], sentences[i]))
                    elif pos[1] == "NP":
                        morphLst_NP.append((pos[0], pos[1], sentences[i]))
                        if pos[0] in morphs_NP_people:
                            morphLst_NP_people.append((pos[0], pos[1], sentences[i]))
                        elif pos[0] in morphs_NP_things:
                            morphLst_NP_things.append((pos[0], pos[1], sentences[i]))
                    elif pos[1] == "NR":
                        morphLst_NR.append((pos[0], pos[1], sentences[i]))
                elif pos[1] == "IC":
                    morphLst_IC.append((pos[0], pos[1], sentences[i]))

                elif pos[1] in morphs_verb:
                    morphLst_verb.append((pos[0], pos[1], sentences[i]))
                    if pos[1] == "VV":
                        morphLst_VV.append((pos[0], pos[1], sentences[i]))
                    elif pos[1] == "VA":
                        morphLst_VA.append((pos[0], pos[1], sentences[i]))
                    elif pos[1] == "VX":
                        morphLst_VX.append((pos[0], pos[1], sentences[i]))
                    elif pos[1] == "VCP":
                        morphLst_VCP.append((pos[0], pos[1], sentences[i]))
                    elif pos[1] == "VCN":
                        morphLst_VCN.append((pos[0], pos[1], sentences[i]))

                elif pos[1] in morphs_mod:
                    morphLst_mod.append((pos[0], pos[1], sentences[i]))
                    if pos[1] == "MM":
                        morphLst_MM.append((pos[0], pos[1], sentences[i]))
                    elif pos[1] in morphs_MA:
                        morphs_MA.append((pos[0], pos[1], sentences[i]))

            elif pos[1] in morphs_formal:
                morphLst_formal.append((pos[0], pos[1], sentences[i]))
                if pos[1] in morphs_J:
                    morphLst_J.append((pos[0], pos[1], sentences[i]))
                elif pos[1] in morphs_E:
                    morphLst_E.append((pos[0], pos[1], sentences[i]))
                elif pos[1] in morphs_X:
                    morphLst_X.append((pos[0], pos[1], sentences[i]))

    # result -----------------------------------------------------------------------------
    result["charCnt"] = charCnt
    result["morphCnt"] = len(kkma)
    result["wordCnt"] = len(words)
    result["sentenceCnt"] = len(sentences)
    result["paraCnt"] = paraCnt

    result["morphCnt_content"] = len(morphLst_content)
    result["morphCnt_substansive"] = len(morphLst_substansive)
    result["morphCnt_noun"] = len(morphLst_noun)
    result["morphCnt_NNG"] = len(morphLst_NNG)
    result["morphCnt_NNP"] = len(morphLst_NNP)
    result["morphCnt_NNB"] = len(morphLst_NNB)
    result["morphCnt_NP"] = len(morphLst_NP)
    result["morphCnt_NP_people"] = len(morphLst_NP_people)
    result["morphCnt_NP_things"] = len(morphLst_NP_things)
    result["morphCnt_NR"] = len(morphLst_NR)
    result["morphCnt_verb"] = len(morphLst_verb)
    result["morphCnt_VV"] = len(morphLst_VV)
    result["morphCnt_VA"] = len(morphLst_VA)
    result["morphCnt_VX"] = len(morphLst_VX)
    result["morphCnt_VCP"] = len(morphLst_VCP)
    result["morphCnt_VCN"] = len(morphLst_VCN)
    result["morphCnt_mod"] = len(morphLst_mod)
    result["morphCnt_MA"] = len(morphLst_MA)
    result["morphCnt_MM"] = len(morphLst_MM)
    result["morphCnt_formal"] = len(morphLst_formal)
    result["morphCnt_J"] = len(morphLst_J)
    result["morphCnt_E"] = len(morphLst_E)
    result["morphCnt_X"] = len(morphLst_X)
    result["morphCnt_IC"] = len(morphLst_IC)

    result["morphLst_substansive"] = morphLst_substansive
    result["morphLst_noun"] = morphLst_noun
    result["morphLst_NNG"] = morphLst_NNG
    result["morphLst_NNP"] = morphLst_NNP
    result["morphLst_NNB"] = morphLst_NNB
    result["morphLst_NP"] = morphLst_NP
    result["morphLst_NP_people"] = morphLst_NP_people
    result["morphLst_NP_things"] = morphLst_NP_things
    result["morphLst_NR"] = morphLst_NR
    result["morphLst_verb"] = morphLst_verb
    result["morphLst_VV"] = morphLst_VV
    result["morphLst_VA"] = morphLst_VA
    result["morphLst_VX"] = morphLst_VX
    result["morphLst_VCP"] = morphLst_VCP
    result["morphLst_VCN"] = morphLst_VCN
    result["morphLst_mod"] = morphLst_mod
    result["morphLst_MA"] = morphLst_MA
    result["morphLst_MM"] = morphLst_MM
    result["morphLst_J"] = morphLst_J
    result["morphLst_E"] = morphLst_E
    result["morphLst_X"] = morphLst_X
    result["morphLst_IC"] = morphLst_IC

    return result
