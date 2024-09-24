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
    morphLst_CL = []
    morphLst_NL = []
    morphLst_NN = []
    morphLst_NNG = []
    morphLst_NNP = []
    morphLst_NNB = []
    morphLst_NP = []
    morphLst_NP_people = []
    morphLst_NP_things = []
    morphLst_NR = []
    morphLst_VL = []
    morphLst_VV = []
    morphLst_VA = []
    morphLst_VX = []
    morphLst_VCP = []
    morphLst_VCN = []
    morphLst_ML = []
    morphLst_MM = []
    morphLst_MA = []
    morphLst_FL = []
    morphLst_J = []
    morphLst_E = []
    morphLst_X = []
    morphLst_IC = []

    # morphs -----------------------------------------------------------------------------
    morphs_CL = [
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
    morphs_NL = ["NNG", "NNP", "NNB", "NNBC", "NP", "NR"]  # 체언
    morphs_NN = ["NNG", "NNP", "NNB", "NNBC"]  # 명사
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
    morphs_VL = ["VV", "VA", "VX", "VCP", "VCN"]
    morphs_ML = ["MM", "MAG", "MAJ"]
    morphs_MA = ["MAG", "MAJ"]
    morphs_FL = [
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

            if pos[1] in morphs_CL:
                morphLst_CL.append(
                    (len(morphLst_CL), pos[0], pos[1], sentences[i])
                )
                if pos[1] in morphs_NL:  # 체언
                    morphLst_NL.append(
                        (len(morphLst_NL), pos[0], pos[1], sentences[i])
                    )
                    if pos[1] in morphs_NN:
                        morphLst_NN.append(
                            (len(morphLst_NN), pos[0], pos[1], sentences[i])
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

                elif pos[1] in morphs_VL:
                    morphLst_VL.append(
                        (len(morphLst_VL), pos[0], pos[1], sentences[i])
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

                elif pos[1] in morphs_ML:
                    morphLst_ML.append(
                        (len(morphLst_ML), pos[0], pos[1], sentences[i])
                    )
                    if pos[1] == "MM":
                        morphLst_MM.append(
                            (len(morphLst_MM), pos[0], pos[1], sentences[i])
                        )
                    elif pos[1] in morphs_MA:
                        morphs_MA.append((len(morphs_MA), pos[0], pos[1], sentences[i]))

            elif pos[1] in morphs_FL:
                morphLst_FL.append(
                    (len(morphLst_FL), pos[0], pos[1], sentences[i])
                )
                if pos[1] in morphs_J:
                    morphLst_J.append((len(morphLst_J), pos[0], pos[1], sentences[i]))
                elif pos[1] in morphs_E:
                    morphLst_E.append((len(morphLst_E), pos[0], pos[1], sentences[i]))
                elif pos[1] in morphs_X:
                    morphLst_X.append((len(morphLst_X), pos[0], pos[1], sentences[i]))

    # cnt result --------------------------------------------------------------------------
    result["para_Cnt"] = paraCnt
    result["sentence_Cnt"] = len(sentences)
    result["word_Cnt"] = len(words)
    result["morph_Cnt"] = len(kkma)
    result["char_Cnt"] = charCnt

    result["CL_Cnt"] = len(morphLst_CL)
    result["NL_Cnt"] = len(morphLst_NL)
    result["NN_Cnt"] = len(morphLst_NN)
    result["NNG_Cnt"] = len(morphLst_NNG)
    result["NNP_Cnt"] = len(morphLst_NNP)
    result["NNB_Cnt"] = len(morphLst_NNB)
    result["NP_Cnt"] = len(morphLst_NP)
    result["NP_People_Cnt"] = len(morphLst_NP_people)
    result["NP_Things_Cnt"] = len(morphLst_NP_things)
    result["NR_Cnt"] = len(morphLst_NR)

    result["VL_Cnt"] = len(morphLst_VL)
    result["VV_Cnt"] = len(morphLst_VV)
    result["VA_Cnt"] = len(morphLst_VA)
    result["VX_Cnt"] = len(morphLst_VX)
    result["VCP_Cnt"] = len(morphLst_VCP)
    result["VCN_Cnt"] = len(morphLst_VCN)

    result["ML_Cnt"] = len(morphLst_ML)
    result["MA_Cnt"] = len(morphLst_MA)
    result["MM_Cnt"] = len(morphLst_MM)

    result["FL_Cnt"] = len(morphLst_FL)
    result["J_Cnt"] = len(morphLst_J)
    result["E_Cnt"] = len(morphLst_E)
    result["X_Cnt"] = len(morphLst_X)
    result["IC_Cnt"] = len(morphLst_IC)

    # Number of Different Words ------------------------------------------------------------
    resultNDW = collections.defaultdict()

    # resultNDW["word_NDW"] = len(set(words))
    resultNDW["morph_NDW"] = len(set(kkma))

    resultNDW["NL_NDW"] = len(set(morphLst_NL))
    resultNDW["NNG_NDW"] = len(set(morphLst_NNG))
    resultNDW["NNP_NDW"] = len(set(morphLst_NNP))
    resultNDW["NNB_NDW"] = len(set(morphLst_NNB))
    resultNDW["NP_NDW"] = len(set(morphLst_NP))
    resultNDW["NR_NDW"] = len(set(morphLst_NR))

    resultNDW["VL_NDW"] = len(set(morphLst_VL))
    resultNDW["VV_NDW"] = len(set(morphLst_VV))
    resultNDW["VA_NDW"] = len(set(morphLst_VA))

    resultNDW["ML_NDW"] = len(set(morphLst_ML))
    resultNDW["MM_NDW"] = len(set(morphLst_MM))

    resultNDW["IC_NDW"] = len(set(morphLst_IC))
    resultNDW["J_NDW"] = len(set(morphLst_J))
    resultNDW["E_NDW"] = len(set(morphLst_E))
    resultNDW["X_NDW"] = len(set(morphLst_X))
    resultNDW["CL_NDW"] = len(set(morphLst_CL))
    resultNDW["FL_NDW"] = len(set(morphLst_FL))

    # density result -----------------------------------------------------------------------
    resultDensity = collections.defaultdict()

    resultDensity["CL_Den"] = len(morphLst_CL) / len(kkma)
    resultDensity["FL_Den"] = len(morphLst_FL) / len(kkma)
    resultDensity["NL_Den"] = len(morphLst_NN) / len(kkma)
    resultDensity["NNGL_Den"] = len(morphLst_NNG) / len(kkma)
    resultDensity["NNPL_Den"] = len(morphLst_NNP) / len(kkma)
    resultDensity["NNBL_Den"] = len(morphLst_NNB) / len(kkma)
    resultDensity["NPL_Den"] = len(morphLst_NP) / len(kkma)
    resultDensity["NML_Den"] = len(morphLst_NR) / len(kkma)
    resultDensity["VL_Den"] = len(morphLst_VL) / len(kkma)
    resultDensity["VVL_Den"] = len(morphLst_VV) / len(kkma)
    resultDensity["VAL_Den"] = len(morphLst_VA) / len(kkma)
    resultDensity["ML_Den"] = len(morphLst_ML) / len(kkma)
    resultDensity["MML_Den"] = len(morphLst_MM) / len(kkma)
    resultDensity["MAL_Den"] = len(morphLst_MA) / len(kkma)
    resultDensity["JL_Den"] = len(morphLst_J) / len(kkma)
    resultDensity["EL_Den"] = len(morphLst_E) / len(kkma)
    resultDensity["XL_Den"] = len(morphLst_X) / len(kkma)
    resultDensity["ITL_Den"] = len(morphLst_IC) / len(kkma)

    resultDensity["NCL_Den"] = len(morphLst_NN) / len(morphLst_CL)
    resultDensity["NNCL_Den"] = len(morphLst_NNG) / len(morphLst_CL)
    resultDensity["NNGCL_Den"] = len(morphLst_NNP) / len(morphLst_CL)
    resultDensity["NNBCL_Den"] = len(morphLst_NNB) / len(morphLst_CL)
    resultDensity["NPCL_Den"] = len(morphLst_NP) / len(morphLst_CL)
    resultDensity["NMCL_Den"] = len(morphLst_NR) / len(morphLst_CL)
    resultDensity["VCL_Den"] = len(morphLst_VL) / len(morphLst_CL)
    resultDensity["VVCL_Den"] = len(morphLst_VV) / len(morphLst_CL)
    resultDensity["VACL_Den"] = len(morphLst_VA) / len(morphLst_CL)
    resultDensity["MCL_Den"] = len(morphLst_ML) / len(morphLst_CL)
    resultDensity["MMCL_Den"] = len(morphLst_MM) / len(morphLst_CL)
    resultDensity["MACL_Den"] = len(morphLst_MA) / len(morphLst_CL)
    resultDensity["INCL_Den"] = len(morphLst_IC) / len(morphLst_CL)
    resultDensity["JFL_Den"] = len(morphLst_J) / len(morphLst_FL)
    resultDensity["EFL_Den"] = len(morphLst_E) / len(morphLst_FL)
    resultDensity["XFL_Den"] = len(morphLst_X) / len(morphLst_FL)

    # result list ------------------------------------------------------------------------
    resultLst["NL_Lst"] = morphLst_NL
    resultLst["NN_Lst"] = morphLst_NN
    resultLst["NNG_Lst"] = morphLst_NNG
    resultLst["NNP_Lst"] = morphLst_NNP
    resultLst["NNB_Lst"] = morphLst_NNB
    resultLst["NP_Lst"] = morphLst_NP
    resultLst["NP_People_Lst"] = morphLst_NP_people
    resultLst["NP_Things_Lst"] = morphLst_NP_things
    resultLst["NR_Lst"] = morphLst_NR
    resultLst["VL_Lst"] = morphLst_VL
    resultLst["VV_Lst"] = morphLst_VV
    resultLst["VA_Lst"] = morphLst_VA
    resultLst["VX_Lst"] = morphLst_VX
    resultLst["VCP_Lst"] = morphLst_VCP
    resultLst["VCN_Lst"] = morphLst_VCN
    resultLst["ML_Lst"] = morphLst_ML
    resultLst["MA_Lst"] = morphLst_MA
    resultLst["MM_Lst"] = morphLst_MM
    resultLst["J_Lst"] = morphLst_J
    resultLst["E_Lst"] = morphLst_E
    resultLst["X_Lst"] = morphLst_X
    resultLst["IC_Lst"] = morphLst_IC

    resultLvl = collections.defaultdict()

    (
        resultLvl["morph_LenAvg"],
        resultLvl["morph_LenStd"],
        resultLvl["word_LenAvg"],
        resultLvl["word_LenStd"],
    ) = avgLen(words, kkma_simple)

    # final result ------------------------------------------------------------------------
    finalresult["basic_count"] = result
    finalresult["NDW"] = resultNDW
    finalresult["basic_density"] = resultDensity
    finalresult["basic_level"] = resultLvl
    finalresult["basic_list"] = resultLst

    return finalresult
