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

	resultDensity = collections.defaultdict()

	resultDensity["CLD"] = len(morphLst_content) / len(kkma)
	resultDensity["FLD"] = len(morphLst_formal) / len(kkma)
	resultDensity["NLD"] = len(morphLst_noun) / len(kkma)
	resultDensity["NNGLD"] = len(morphLst_NNG) / len(kkma)
	resultDensity["NNPLD"] = len(morphLst_NNP) / len(kkma)
	resultDensity["NNBLD"] = len(morphLst_NNB) / len(kkma)
	resultDensity["NPLD"] = len(morphLst_NP) / len(kkma)
	resultDensity["NMLD"] = len(morphLst_NR) / len(kkma)
	resultDensity["VLD"] = len(morphLst_verb) / len(kkma)
	resultDensity["VVLD"] = len(morphLst_VV) / len(kkma)
	resultDensity["VALD"] = len(morphLst_VA) / len(kkma)
	resultDensity["MLD"] = len(morphLst_mod) / len(kkma)
	resultDensity["MMLD"] = len(morphLst_MM) / len(kkma)
	resultDensity["MALD"] = len(morphLst_MA) / len(kkma)
	resultDensity["JLD"] = len(morphLst_J) / len(kkma)
	resultDensity["ELD"] = len(morphLst_E) / len(kkma)
	resultDensity["XLD"] = len(morphLst_X) / len(kkma)
	resultDensity["ITLD"] = len(morphLst_IC) / len(kkma)

	resultDensity["NCLD"] = len(morphLst_noun) / len(morphLst_content)
	resultDensity["NNCLD"] = len(morphLst_NNG) / len(morphLst_content)
	resultDensity["NNGCLD"] = len(morphLst_NNP) / len(morphLst_content)
	resultDensity["NNBCLD"] = len(morphLst_NNB) / len(morphLst_content)
	resultDensity["NPCLD"] = len(morphLst_NP) / len(morphLst_content)
	resultDensity["NMCLD"] = len(morphLst_NR) / len(morphLst_content)
	resultDensity["VCLD"] = len(morphLst_verb) / len(morphLst_content)
	resultDensity["VVCLD"] = len(morphLst_VV) / len(morphLst_content)
	resultDensity["VACLD"] = len(morphLst_VA) / len(morphLst_content)
	resultDensity["MCLD"] = len(morphLst_mod) / len(morphLst_content)
	resultDensity["MMCLD"] = len(morphLst_MM) / len(morphLst_content)
	resultDensity["MACLD"] = len(morphLst_MA) / len(morphLst_content)
	resultDensity["INCLD"] = len(morphLst_IC) / len(morphLst_content)
	resultDensity["JFLD"] = len(morphLst_J) / len(morphLst_formal)
	resultDensity["EFLD"] = len(morphLst_E) / len(morphLst_formal)
	resultDensity["XFLD"] = len(morphLst_X) / len(morphLst_formal)

	# result list ------------------------------------------------------------------------
	resultLst["morphLst_substansive"] = morphLst_substansive
	resultLst["morphLst_noun"] = morphLst_noun
	resultLst["morphLst_NNG"] = morphLst_NNG
	resultLst["morphLst_NNP"] = morphLst_NNP
	resultLst["morphLst_NNB"] = morphLst_NNB
	resultLst["morphLst_NP"] = morphLst_NP
	resultLst["morphLst_NP_people"] = morphLst_NP_people
	resultLst["morphLst_NP_things"] = morphLst_NP_things
	resultLst["morphLst_NR"] = morphLst_NR
	resultLst["morphLst_verb"] = morphLst_verb
	resultLst["morphLst_VV"] = morphLst_VV
	resultLst["morphLst_VA"] = morphLst_VA
	resultLst["morphLst_VX"] = morphLst_VX
	resultLst["morphLst_VCP"] = morphLst_VCP
	resultLst["morphLst_VCN"] = morphLst_VCN
	resultLst["morphLst_mod"] = morphLst_mod
	resultLst["morphLst_MA"] = morphLst_MA
	resultLst["morphLst_MM"] = morphLst_MM
	resultLst["morphLst_J"] = morphLst_J
	resultLst["morphLst_E"] = morphLst_E
	resultLst["morphLst_X"] = morphLst_X
	resultLst["morphLst_IC"] = morphLst_IC

	resultLvl = collections.defaultdict()

	(
		resultLvl["avgLen_morph"],
		resultLvl["stdLen_morph"],
		resultLvl["avgLen_word"],
		resultLvl["stdLen_word"],
	) = avgLen(words, kkma_simple)

	# final result ------------------------------------------------------------------------
	finalresult["basic_count"] = result
	finalresult["basic_density"] = resultDensity
	finalresult["basic_level"] = resultLvl
	finalresult["basic_list"] = resultLst
	
	return finalresult
