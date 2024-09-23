import collections
import math
from lexical_diversity import lex_div as ld


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


def init(words, kkma):
	content_morphs = []
	for word in words:
		pos = kkma
		for morp in pos:
			if morp[1] in morphs_content:
				content_morphs.append(morp[0])


# 단어 전체 ttr
def lemma_TTR(words, kkma):
	types = collections.defaultdict(int)
	for word in words:
		types[word] = types[word] + 1

	return len(types) / len(words)


def calculate_TTR(words, kkma, morphs=None):
	type_counts = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morphs and morp[1] in morphs:
				type_counts[morp[0]] += 1
				totalCnt += 1

	try:
		return len(type_counts) / totalCnt
	except ZeroDivisionError:
		return 0


# ngram TTR -----------------------------------------------------
def ngram_TTR(words, kkma):
	result = collections.defaultdict()
	for i in range(2, 9):
		n = i
		ngrams = []
		for b in range(0, len(words) - n + 1):
			ngrams.append(tuple(words[b : b + n]))
		uniquengrams = set(ngrams)

		if len(ngrams) == 0:
			return 0

		result[f"ngram{n}_TTR"] = len(uniquengrams) / len(ngrams)
	return result


# -----------------------------------------------------
# 어휘형태소(명사 동사 형용사 부사) 개수의 비율
def lexicalDensityTokens(words, kkma):
	cnt = 0
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			totalCnt += len(pos)
			if "NN" in morp[1] or "V" in morp[1] or "MA" in morp[1]:
				cnt += 1

	return cnt / totalCnt


# 어휘형태소 종류의 비율
def lexicalDensityTypes(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			totalCnt += len(pos)
			if "NN" in morp[1] or "V" in morp[1] or "MA" in morp[1]:
				type[morp[0]] = type[morp[0]] + 1

	return len(type) / totalCnt


def TTR(words, kkma):
	result = collections.defaultdict()
	result["lemma_TTR"] = lemma_TTR(words, kkma)
	result["content_TTR"] = calculate_TTR(words, kkma, morphs=morphs_content)
	result["substantive_TTR"] = calculate_TTR(words, kkma, morphs=morphs_substansive)
	result["noun_TTR"] = calculate_TTR(words, kkma, morphs=morphs_noun)
	result["NNG_TTR"] = calculate_TTR(words, kkma, morphs=["NNG"])
	result["NNP_TTR"] = calculate_TTR(words, kkma, morphs=["NNP"])
	result["NNB_TTR"] = calculate_TTR(words, kkma, morphs=["NNB"])
	result["NP_TTR"] = calculate_TTR(words, kkma, morphs=["NP"])
	result["NR_TTR"] = calculate_TTR(words, kkma, morphs=["NR"])
	result["verb_TTR"] = calculate_TTR(words, kkma, morphs=morphs_verb)
	result["VV_TTR"] = calculate_TTR(words, kkma, morphs=["VV"])
	result["VA_TTR"] = calculate_TTR(words, kkma, morphs=["VA"])
	result["mod_TTR"] = calculate_TTR(words, kkma, morphs=morphs_mod)
	result["MM_TTR"] = calculate_TTR(words, kkma, morphs=["MM"])
	result["MA_TTR"] = calculate_TTR(words, kkma, morphs=morphs_MA)
	result["IC_TTR"] = calculate_TTR(words, kkma, morphs=["IC"])
	result["formal_TTR"] = calculate_TTR(words, kkma, morphs=morphs_formal)
	result["J_TTR"] = calculate_TTR(words, kkma, morphs=morphs_J)
	result["E_TTR"] = calculate_TTR(words, kkma, morphs=morphs_E)
	result["X_TTR"] = calculate_TTR(words, kkma, morphs=morphs_X)
	for key, value in ngram_TTR(words, kkma).items():
		result[key] = value
	result["lexicalDensityTokens"] = lexicalDensityTokens(words, kkma)
	result["lexicalDensityTypes"] = lexicalDensityTypes(words, kkma)
	return result


# rttr ----------------------------------------------------------------
def lemma_RTTR(words, kkma):
	types = collections.defaultdict(int)
	for word in words:
		types[word] = types[word] + 1

	return len(types) / math.sqrt(len(words))


def calculate_RTTR(words, kkma, morphs=None):
	type_counts = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morphs and morp[1] in morphs:
				type_counts[morp[0]] += 1
				totalCnt += 1

	try:
		return len(type_counts) / math.sqrt(totalCnt)
	except ZeroDivisionError:
		return 0


def RTTR(words, kkma):
	result = collections.defaultdict()
	result["lemma_RTTR"] = lemma_RTTR(words, kkma)
	result["content_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_content)
	result["substantive_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_substansive)
	result["noun_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_noun)
	result["NNG_RTTR"] = calculate_RTTR(words, kkma, morphs=["NNG"])
	result["NNP_RTTR"] = calculate_RTTR(words, kkma, morphs=["NNP"])
	result["NNB_RTTR"] = calculate_RTTR(words, kkma, morphs=["NNB"])
	result["NP_RTTR"] = calculate_RTTR(words, kkma, morphs=["NP"])
	result["NR_RTTR"] = calculate_RTTR(words, kkma, morphs=["NR"])
	result["verb_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_verb)
	result["VV_RTTR"] = calculate_RTTR(words, kkma, morphs=["VV"])
	result["VA_RTTR"] = calculate_RTTR(words, kkma, morphs=["VA"])
	result["mod_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_mod)
	result["MM_RTTR"] = calculate_RTTR(words, kkma, morphs=["MM"])
	result["MA_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_MA)
	result["IC_RTTR"] = calculate_RTTR(words, kkma, morphs=["IC"])
	result["formal_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_formal)
	result["J_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_J)
	result["E_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_E)
	result["X_RTTR"] = calculate_RTTR(words, kkma, morphs=morphs_X)
	return result


# CTTR ----------------------------------------------------------------
def lemma_CTTR(words, kkma):
	types = collections.defaultdict(int)
	for word in words:
		types[word] = types[word] + 1

	return len(types) / math.sqrt(2 * len(words))


def calculate_CTTR(words, kkma, morphs=None):
	type_counts = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morphs and morp[1] in morphs:
				type_counts[morp[0]] += 1
				totalCnt += 1

	try:
		return len(type_counts) / math.sqrt(2 * totalCnt)
	except ZeroDivisionError:
		return 0


def CTTR(words, kkma):
	result = collections.defaultdict()
	result["lemma_CTTR"] = lemma_CTTR(words, kkma)
	result["content_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_content)
	result["substantive_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_substansive)
	result["noun_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_noun)
	result["NNG_CTTR"] = calculate_CTTR(words, kkma, morphs=["NNG"])
	result["NNP_CTTR"] = calculate_CTTR(words, kkma, morphs=["NNP"])
	result["NNB_CTTR"] = calculate_CTTR(words, kkma, morphs=["NNB"])
	result["NP_CTTR"] = calculate_CTTR(words, kkma, morphs=["NP"])
	result["NR_CTTR"] = calculate_CTTR(words, kkma, morphs=["NR"])
	result["verb_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_verb)
	result["VV_CTTR"] = calculate_CTTR(words, kkma, morphs=["VV"])
	result["VA_CTTR"] = calculate_CTTR(words, kkma, morphs=["VA"])
	result["mod_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_mod)
	result["MM_CTTR"] = calculate_CTTR(words, kkma, morphs=["MM"])
	result["MA_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_MA)
	result["IC_CTTR"] = calculate_CTTR(words, kkma, morphs=["IC"])
	result["formal_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_formal)
	result["J_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_J)
	result["E_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_E)
	result["X_CTTR"] = calculate_CTTR(words, kkma, morphs=morphs_X)
	return result


# MSTTR ----------------------------------------------------------------
def lemma_MSTTR(words, kkma):
	if len(words) < 50:
		return -1
	idx = 0
	ttr = 0.0
	cnt = 0
	while idx <= len(words):
		types = collections.defaultdict(int)
		ttrList = words[idx : idx + 50]
		if len(ttrList) == 0:
			return 0
		for word in ttrList:
			types[word] = types[word] + 1
		cnt += 1
		ttr += len(types) / len(ttrList)
		idx += 50
	if cnt == 0:
		return 0
	return ttr / cnt


def calculate_MSTTR(words, kkma, morphs=None):
	if len(words) < 50:
		return -1
	idx = 0
	ttr = 0.0
	cnt = 0
	while idx <= len(words):
		types = collections.defaultdict(int)
		ttrList = words[idx : idx + 50]
		if len(ttrList) == 0:
			return 0
		for word in ttrList:
			pos = kkma
			for morp in pos:
				if morphs and morp[1] in morphs:
					types[morp[0]] = types[morp[0]] + 1
		cnt += 1
		ttr += len(types) / len(ttrList)
		idx += 50
	if cnt == 0:
		return 0
	return ttr / cnt


def MSTTR(words, kkma):
	result = collections.defaultdict()
	result["lemma_MSTTR"] = lemma_MSTTR(words, kkma)
	result["content_MSTTR"] = calculate_MSTTR(words, kkma, morphs=morphs_content)
	result["substantive_MSTTR"] = calculate_MSTTR(
		words, kkma, morphs=morphs_substansive
	)
	result["noun_MSTTR"] = calculate_MSTTR(words, kkma, morphs=morphs_noun)
	result["NNG_MSTTR"] = calculate_MSTTR(words, kkma, morphs=["NNG"])
	result["NNP_MSTTR"] = calculate_MSTTR(words, kkma, morphs=["NNP"])
	result["NNB_MSTTR"] = calculate_MSTTR(words, kkma, morphs=["NNB"])
	result["NP_MSTTR"] = calculate_MSTTR(words, kkma, morphs=["NP"])
	result["NR_MSTTR"] = calculate_MSTTR(words, kkma, morphs=["NR"])
	result["verb_MSTTR"] = calculate_MSTTR(words, kkma, morphs=morphs_verb)
	result["VV_MSTTR"] = calculate_MSTTR(words, kkma, morphs=["VV"])
	result["VA_MSTTR"] = calculate_MSTTR(words, kkma, morphs=["VA"])
	result["mod_MSTTR"] = calculate_MSTTR(words, kkma, morphs=morphs_mod)
	result["MM_MSTTR"] = calculate_MSTTR(words, kkma, morphs=["MM"])
	result["MA_MSTTR"] = calculate_MSTTR(words, kkma, morphs=morphs_MA)
	result["IC_MSTTR"] = calculate_MSTTR(words, kkma, morphs=["IC"])
	result["formal_MSTTR"] = calculate_MSTTR(words, kkma, morphs=morphs_formal)
	result["J_MSTTR"] = calculate_MSTTR(words, kkma, morphs=morphs_J)
	result["E_MSTTR"] = calculate_MSTTR(words, kkma, morphs=morphs_E)
	result["X_MSTTR"] = calculate_MSTTR(words, kkma, morphs=morphs_X)
	return result


# MATTR ----------------------------------------------------------------
def lemma_MATTR(words, kkma):
	if len(words) < 50:
		return -1
	idx = 0
	ttr = 0.0
	cnt = 0
	while idx <= len(words):
		types = collections.defaultdict(int)
		ttrList = words[idx : idx + 50]
		if len(ttrList) == 0:
			return 0
		for word in ttrList:
			types[word] = types[word] + 1
		cnt += 1
		ttr += len(types) / 50
		idx += 1
	if cnt == 0:
		return 0
	return ttr / cnt


def calculate_MATTR(words, kkma, morphs=None):
	if len(words) < 50:
		return -1
	idx = 0
	ttr = 0.0
	cnt = 0
	while idx <= len(words):
		types = collections.defaultdict(int)
		ttrList = words[idx : idx + 50]
		if len(ttrList) == 0:
			return 0
		for word in ttrList:
			pos = kkma
			for morp in pos:
				if morphs and morp[1] in morphs:
					types[morp[0]] = types[morp[0]] + 1
		cnt += 1
		ttr += len(types) / 50
		idx += 1
	if cnt == 0:
		return 0
	return ttr / cnt


def MATTR(words, kkma):
	result = collections.defaultdict()
	result["lemma_MATTR"] = lemma_MATTR(words, kkma)
	result["content_MATTR"] = calculate_MATTR(words, kkma, morphs=morphs_content)
	result["substantive_MATTR"] = calculate_MATTR(
		words, kkma, morphs=morphs_substansive
	)
	result["noun_MATTR"] = calculate_MATTR(words, kkma, morphs=morphs_noun)
	result["NNG_MATTR"] = calculate_MATTR(words, kkma, morphs=["NNG"])
	result["NNP_MATTR"] = calculate_MATTR(words, kkma, morphs=["NNP"])
	result["NNB_MATTR"] = calculate_MATTR(words, kkma, morphs=["NNB"])
	result["NP_MATTR"] = calculate_MATTR(words, kkma, morphs=["NP"])
	result["NR_MATTR"] = calculate_MATTR(words, kkma, morphs=["NR"])
	result["verb_MATTR"] = calculate_MATTR(words, kkma, morphs=morphs_verb)
	result["VV_MATTR"] = calculate_MATTR(words, kkma, morphs=["VV"])
	result["VA_MATTR"] = calculate_MATTR(words, kkma, morphs=["VA"])
	result["mod_MATTR"] = calculate_MATTR(words, kkma, morphs=morphs_mod)
	result["MM_MATTR"] = calculate_MATTR(words, kkma, morphs=["MM"])
	result["MA_MATTR"] = calculate_MATTR(words, kkma, morphs=morphs_MA)
	result["IC_MATTR"] = calculate_MATTR(words, kkma, morphs=["IC"])
	result["formal_MATTR"] = calculate_MATTR(words, kkma, morphs=morphs_formal)
	result["J_MATTR"] = calculate_MATTR(words, kkma, morphs=morphs_J)
	result["E_MATTR"] = calculate_MATTR(words, kkma, morphs=morphs_E)
	result["X_MATTR"] = calculate_MATTR(words, kkma, morphs=morphs_X)
	return result


# MTLD ----------------------------------------------------------------
def MTLD(words, kkma):
	result = collections.defaultdict()
	result["lemma_MTLD"] = ld.mtld(words)
	return result