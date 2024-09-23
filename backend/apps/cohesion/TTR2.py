import collections
from lexical_diversity import lex_div as ld


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


def content_Lst(kkma):
	content_lst = []
	substansive_lst = []
	noun_lst = []
	NNG_lst = []
	NNP_lst = []
	NNB_lst = []
	NP_lst = []
	NR_lst = []
	verb_lst = []
	VV_lst = []
	VA_lst = []
	mod_lst = []
	MM_lst = []
	MA_lst = []
	IC_lst = []
	formal_lst = []
	J_lst = []
	E_lst = []
	X_lst = []

	for morp in kkma:
		if morp[1] in morphs_content:
			content_lst.append(morp[0])
		if morp[1] in morphs_substansive:
			substansive_lst.append(morp[0])
		if morp[1] in morphs_noun:
			noun_lst.append(morp[0])
		if morp[1] == "NNG":
			NNG_lst.append(morp[0])
		if morp[1] == "NNP":
			NNP_lst.append(morp[0])
		if morp[1] == "NNB":
			NNB_lst.append(morp[0])	
		if morp[1] == "NP":	
			NP_lst.append(morp[0])	
		if morp[1] == "NR":	
			NR_lst.append(morp[0])	
		if morp[1] in morphs_verb:	
			verb_lst.append(morp[0])	
		if morp[1] == "VV":	
			VV_lst.append(morp[0])	
		if morp[1] == "VA":
			VA_lst.append(morp[0])
		if morp[1] in morphs_mod:	
			mod_lst.append(morp[0])	
		if morp[1] == "MM":
			MM_lst.append(morp[0])
		if morp[1] in morphs_MA:
			MA_lst.append(morp[0])	
		if morp[1] == "IC":
			IC_lst.append(morp[0])
		if morp[1] in morphs_formal:
			formal_lst.append(morp[0])
		if morp[1] in morphs_J:
			J_lst.append(morp[0])	
		if morp[1] in morphs_E:
			E_lst.append(morp[0])	
		if morp[1] in morphs_X:	
			X_lst.append(morp[0])
	return content_lst
