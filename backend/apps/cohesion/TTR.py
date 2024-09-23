import collections


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


# 단어 전체 ttr
def lemmaTTR(words, kkma):
    types = collections.defaultdict(int)
    for word in words:
        types[word] = types[word] + 1

    return len(types) / len(words)


# 단어 50개단위 TTR
def lemmaMTTR(words, kkma):
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


def contentTTR(words, kkma):
    type = collections.defaultdict(int)
    totalCnt = 0

    for word in words:
        pos = kkma
        for morp in pos:
            if "NN" in morp[1] or "V" in morp[1] or "MA" in morp[1]:
                try:
                    type[morp[0]] = type[morp[0]] + 1
                except:
                    type[morp[0]] = 0
                totalCnt += 1

    return len(type) / totalCnt


def formalTTR(words, kkma):
    type = collections.defaultdict(int)
    totalCnt = 0

    for word in words:
        pos = kkma
        for morp in pos:
            if morp[1] in morphs_formal:
                type[morp[0]] = type[morp[0]] + 1
                totalCnt += 1

    return len(type) / totalCnt


def nounTTR(words, kkma):
    type = collections.defaultdict(int)
    totalCnt = 0

    for word in words:
        pos = kkma
        for morp in pos:
            if morp[1] in morphs_noun:
                type[morp[0]] = type[morp[0]] + 1
                totalCnt += 1

    return len(type) / totalCnt


def VVTTR(words, kkma):
    type = collections.defaultdict(int)
    totalCnt = 0

    for word in words:
        pos = kkma
        for morp in pos:
            if "VV" in morp[1]:
                type[morp[0]] = type[morp[0]] + 1
                totalCnt += 1

    return len(type) / totalCnt


def VATTR(words, kkma):
    type = collections.defaultdict(int)
    totalCnt = 0

    for word in words:
        pos = kkma
        for morp in pos:
            if "VA" in morp[1]:
                type[morp[0]] = type[morp[0]] + 1
                totalCnt += 1

    return len(type) / totalCnt


def MATTTR(words, kkma):
    type = collections.defaultdict(int)
    totalCnt = 0

    for word in words:
        pos = kkma
        for morp in pos:
            if morp[1] in morphs_MA:
                type[morp[0]] = type[morp[0]] + 1
                totalCnt += 1

    return len(type) / totalCnt


def bigramLemmaTTR(words):
    n = 2
    ngrams = []
    for b in range(0, len(words) - n + 1):
        ngrams.append(tuple(words[b : b + n]))
    uniquengrams = set(ngrams)

    return len(uniquengrams) / len(ngrams)


def trigramLemmaTTR(words):
    n = 3
    ngrams = []
    for b in range(0, len(words) - n + 1):
        ngrams.append(tuple(words[b : b + n]))
    uniquengrams = set(ngrams)

    if len(ngrams) == 0:
        return 0

    return len(uniquengrams) / len(ngrams)


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


# -----------------------------------------------------
def substantiveTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morp[1] in morphs_substansive:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def NNGTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if "NNG" in morp[1]:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def NNPTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if "NNP" in morp[1]:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def NNBTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if "NNB" in morp[1]:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def NPTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if "NP" in morp[1]:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def NRTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if "NR" in morp[1]:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def verbTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morp[1] in morphs_verb:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1
                    
	return len(type) / totalCnt


def modTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morp[1] in morphs_mod:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def MMTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morp[1] == "MM":
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def ICTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morp[1] == "IC":
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def JTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morp[1] in morphs_J:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def ETTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morp[1] in morphs_E:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt


def XTTR(words, kkma):
	type = collections.defaultdict(int)
	totalCnt = 0

	for word in words:
		pos = kkma
		for morp in pos:
			if morp[1] in morphs_X:
				type[morp[0]] = type[morp[0]] + 1
				totalCnt += 1

	return len(type) / totalCnt