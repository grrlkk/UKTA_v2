import collections
import math
import string


def avgLen(words, kkma_simple):
	morph_len = [len(kkma[0]) for kkma in kkma_simple]
	morph_avg = sum(morph_len) / len(morph_len)
	morph_std = math.sqrt(
		sum([(x - morph_avg) ** 2 for x in morph_len]) / len(morph_len)
	)

	for i in range(len(words)):
		words[i] = words[i].translate(str.maketrans("", "", string.punctuation))

	words_len = [len(word) for word in words]
	words_avg = sum(words_len) / len(words_len)
	words_std = math.sqrt(
		sum([(x - words_avg) ** 2 for x in words_len]) / len(words_len)
	)

	return morph_avg, morph_std, words_avg, words_std


def counter(text, sentences, words, kkma, kkma_list, kkma_simple):
    finalresult = collections.defaultdict()
    result = collections.defaultdict()
    resultLst = collections.defaultdict()

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
        if text[i] == "\n" and i != 0:
            if text[i - 1] == "\n":
                continue
            paraCnt += 1
        if i == len(text) - 1:
            paraCnt += 1

    for i in range(len(kkma_list)):
        for pos in kkma_list[i]:

            if pos[1] in morphs_content:
                morphLst_content.append(
					(len(morphLst_content), pos[0], pos[1], sentences[i])
				)
                if pos[1] in morphs_substansive:  # 체언
                    morphLst_substansive.append(
						(len(morphLst_substansive), pos[0], pos[1], sentences[i])
					)
                    if pos[1] in morphs_noun:
                        morphLst_noun.append(
							(len(morphLst_noun), pos[0], pos[1], sentences[i])
						)
                        if pos[1] == "NNG":
                            morphLst_NNG.append(
								(len(morphLst_NNG), pos[0], pos[1], sentences[i])
							)
                        elif pos[1] == "NNP":
                            morphLst_NNP.append(
								(len(morphLst_NNP), pos[0], pos[1], sentences[i])
							)
                        elif pos[1] == "NNB" or pos[1] == "NNBC":
                            morphLst_NNB.append(
								(len(morphLst_NNB), pos[0], pos[1], sentences[i])
							)
                    elif pos[1] == "NP":
                        morphLst_NP.append(
							(len(morphLst_NP), pos[0], pos[1], sentences[i])
						)
                        if pos[0] in morphs_NP_people:
                            morphLst_NP_people.append(
								(len(morphLst_NP_people), pos[0], pos[1], sentences[i])
							)
                        elif pos[0] in morphs_NP_things:
                            morphLst_NP_things.append(
								(len(morphLst_NP_things), pos[0], pos[1], sentences[i])
							)
                    elif pos[1] == "NR":
                        morphLst_NR.append(
							(len(morphLst_NR), pos[0], pos[1], sentences[i])
						)
                elif pos[1] == "IC":
                    morphLst_IC.append((len(morphLst_IC), pos[0], pos[1], sentences[i]))

                elif pos[1] in morphs_verb:
                    morphLst_verb.append(
						(len(morphLst_verb), pos[0], pos[1], sentences[i])
					)
                    if pos[1] == "VV":
                        morphLst_VV.append(
							(len(morphLst_VV), pos[0], pos[1], sentences[i])
						)
                    elif pos[1] == "VA":
                        morphLst_VA.append(
							(len(morphLst_VA), pos[0], pos[1], sentences[i])
						)
                    elif pos[1] == "VX":
                        morphLst_VX.append(
							(len(morphLst_VX), pos[0], pos[1], sentences[i])
						)
                    elif pos[1] == "VCP":
                        morphLst_VCP.append(
							(len(morphLst_VCP), pos[0], pos[1], sentences[i])
						)
                    elif pos[1] == "VCN":
                        morphLst_VCN.append(
							(len(morphLst_VCN), pos[0], pos[1], sentences[i])
						)

                elif pos[1] in morphs_mod:
                    morphLst_mod.append(
						(len(morphLst_mod), pos[0], pos[1], sentences[i])
					)
                    if pos[1] == "MM":
                        morphLst_MM.append(
							(len(morphLst_MM), pos[0], pos[1], sentences[i])
						)
                    elif pos[1] in morphs_MA:
                        morphs_MA.append((len(morphs_MA), pos[0], pos[1], sentences[i]))

            elif pos[1] in morphs_formal:
                morphLst_formal.append(
					(len(morphLst_formal), pos[0], pos[1], sentences[i])
				)
                if pos[1] in morphs_J:
                    morphLst_J.append((len(morphLst_J), pos[0], pos[1], sentences[i]))
                elif pos[1] in morphs_E:
                    morphLst_E.append((len(morphLst_E), pos[0], pos[1], sentences[i]))
                elif pos[1] in morphs_X:
                    morphLst_X.append((len(morphLst_X), pos[0], pos[1], sentences[i]))

    # cnt result --------------------------------------------------------------------------
    result["charCnt"] = charCnt
    result["morphCnt"] = len(kkma)
    result["wordCnt"] = len(words)
    result["sentenceCnt"] = len(sentences)
    result["paraCnt"] = paraCnt

    result["contentCnt"] = len(morphLst_content)
    result["substansiveCnt"] = len(morphLst_substansive)
    result["nounCnt"] = len(morphLst_noun)
    result["NNGCnt"] = len(morphLst_NNG)
    result["NNPCnt"] = len(morphLst_NNP)
    result["NNBCnt"] = len(morphLst_NNB)
    result["NPCnt"] = len(morphLst_NP)
    result["NPPeopleCnt"] = len(morphLst_NP_people)
    result["NPThingsCnt"] = len(morphLst_NP_things)
    result["NRCnt"] = len(morphLst_NR)

    result["verbCnt"] = len(morphLst_verb)
    result["VVCnt"] = len(morphLst_VV)
    result["VACnt"] = len(morphLst_VA)
    result["VXCnt"] = len(morphLst_VX)
    result["VCPCnt"] = len(morphLst_VCP)
    result["VCNCnt"] = len(morphLst_VCN)

    result["modCnt"] = len(morphLst_mod)
    result["MACnt"] = len(morphLst_MA)
    result["MMCnt"] = len(morphLst_MM)

    result["formalCnt"] = len(morphLst_formal)
    result["JCnt"] = len(morphLst_J)
    result["ECnt"] = len(morphLst_E)
    result["XCnt"] = len(morphLst_X)
    result["ICCnt"] = len(morphLst_IC)

    resultDensity = collections.defaultdict()

    resultDensity["CLDen"] = len(morphLst_content) / len(kkma)
    resultDensity["FLDen"] = len(morphLst_formal) / len(kkma)
    resultDensity["NLDen"] = len(morphLst_noun) / len(kkma)
    resultDensity["NNGLDen"] = len(morphLst_NNG) / len(kkma)
    resultDensity["NNPLDen"] = len(morphLst_NNP) / len(kkma)
    resultDensity["NNBLDen"] = len(morphLst_NNB) / len(kkma)
    resultDensity["NPLDen"] = len(morphLst_NP) / len(kkma)
    resultDensity["NMLDen"] = len(morphLst_NR) / len(kkma)
    resultDensity["VLDen"] = len(morphLst_verb) / len(kkma)
    resultDensity["VVLDen"] = len(morphLst_VV) / len(kkma)
    resultDensity["VALDen"] = len(morphLst_VA) / len(kkma)
    resultDensity["MLDen"] = len(morphLst_mod) / len(kkma)
    resultDensity["MMLDen"] = len(morphLst_MM) / len(kkma)
    resultDensity["MALDen"] = len(morphLst_MA) / len(kkma)
    resultDensity["JLDen"] = len(morphLst_J) / len(kkma)
    resultDensity["ELDen"] = len(morphLst_E) / len(kkma)
    resultDensity["XLDen"] = len(morphLst_X) / len(kkma)
    resultDensity["ITLDen"] = len(morphLst_IC) / len(kkma)

    resultDensity["NCLDen"] = len(morphLst_noun) / len(morphLst_content)
    resultDensity["NNCLDen"] = len(morphLst_NNG) / len(morphLst_content)
    resultDensity["NNGCLDen"] = len(morphLst_NNP) / len(morphLst_content)
    resultDensity["NNBCLDen"] = len(morphLst_NNB) / len(morphLst_content)
    resultDensity["NPCLDen"] = len(morphLst_NP) / len(morphLst_content)
    resultDensity["NMCLDen"] = len(morphLst_NR) / len(morphLst_content)
    resultDensity["VCLDen"] = len(morphLst_verb) / len(morphLst_content)
    resultDensity["VVCLDen"] = len(morphLst_VV) / len(morphLst_content)
    resultDensity["VACLDen"] = len(morphLst_VA) / len(morphLst_content)
    resultDensity["MCLDen"] = len(morphLst_mod) / len(morphLst_content)
    resultDensity["MMCLDen"] = len(morphLst_MM) / len(morphLst_content)
    resultDensity["MACLDen"] = len(morphLst_MA) / len(morphLst_content)
    resultDensity["INCLDen"] = len(morphLst_IC) / len(morphLst_content)
    resultDensity["JFLDen"] = len(morphLst_J) / len(morphLst_formal)
    resultDensity["EFLDen"] = len(morphLst_E) / len(morphLst_formal)
    resultDensity["XFLDen"] = len(morphLst_X) / len(morphLst_formal)

    # result list ------------------------------------------------------------------------
    resultLst["substansiveLst"] = morphLst_substansive
    resultLst["nounLst"] = morphLst_noun
    resultLst["NNGLst"] = morphLst_NNG
    resultLst["NNPLst"] = morphLst_NNP
    resultLst["NNBLst"] = morphLst_NNB
    resultLst["NPLst"] = morphLst_NP
    resultLst["NPPeopleLst"] = morphLst_NP_people
    resultLst["NPThingsLst"] = morphLst_NP_things
    resultLst["NRLst"] = morphLst_NR
    resultLst["verbLst"] = morphLst_verb
    resultLst["VVLst"] = morphLst_VV
    resultLst["VALst"] = morphLst_VA
    resultLst["VXLst"] = morphLst_VX
    resultLst["VCPLst"] = morphLst_VCP
    resultLst["VCNLst"] = morphLst_VCN
    resultLst["modLst"] = morphLst_mod
    resultLst["MALst"] = morphLst_MA
    resultLst["MMLst"] = morphLst_MM
    resultLst["JLst"] = morphLst_J
    resultLst["ELst"] = morphLst_E
    resultLst["XLst"] = morphLst_X
    resultLst["ICLst"] = morphLst_IC

    resultLvl = collections.defaultdict()

    (
        resultLvl["morphLenAvg"],
        resultLvl["morphLenStd"],
        resultLvl["wordLenAvg"],
        resultLvl["wordLenStd"],
    ) = avgLen(words, kkma_simple)

    # final result ------------------------------------------------------------------------
    finalresult["basic_count"] = result
    finalresult["basic_density"] = resultDensity
    finalresult["basic_level"] = resultLvl
    finalresult["basic_list"] = resultLst

    return finalresult
