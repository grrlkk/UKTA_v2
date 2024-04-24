import collections
from concurrent.futures import ThreadPoolExecutor

from apps.morph.morph import mecab
from keybert import KeyBERT
from transformers import BertModel

from . import TTR, adjacent_overlap, counter, similarity, textpreprocess, topic

# 대명사 목록, 지시대명사 -> 인칭대명사 순서
pronounList = [
    "이",
    "그",
    "저",
    "이것",
    "그것",
    "저것",
    "무엇",
    "여기",
    "저기",
    "거기",
    "어디",
    "저희",
    "본인",
    "그대",
    "귀하",
    "너희",
    "당신",
    "여러분",
    "임자",
    "자기",
    "자네",
    "이런",
    "그들",
    "그녀",
    "당신",
    "저희",
    "놈",
    "얘",
    "걔",
    "쟤",
    "누구",
]


def conjuctions(kkma, wordsAfterLemma, words):
    type = collections.defaultdict(int)
    totalCnt = 0

    for word in words:
        pos = kkma
        for morp in pos:
            if morp[1] == "MAG":
                type[morp[0]] = type[morp[0]] + 1
                totalCnt += 1
    if totalCnt == 0:
        return 0
    return len(type) / totalCnt


def processTTR(kkma, words):
    result = collections.defaultdict()

    # lemmazation -----------------------------------------------------------------------
    wordsAfterLemma = textpreprocess.lemma(words)
    result["lemmaCnt"] = len(wordsAfterLemma)

    # TTR --------------------------------------------------------------------------------
    # lemmattr
    result["lemmaTTR"] = TTR.lemmaTtr(wordsAfterLemma)
    # lemma_mattr
    result["lemmaMTTR"] = TTR.lemmaMattr(wordsAfterLemma)
    # lexical_density_tokens
    result["lexicalDensityTokens"] = TTR.lexicalDensityTokens(wordsAfterLemma, kkma)
    # lexical_density_tokens
    result["lexicalDensityTypes"] = TTR.lexicalDensityTypes(wordsAfterLemma, kkma)
    # contentTtr
    result["contentTTR"] = TTR.contentTtr(wordsAfterLemma, kkma)
    # functionTtr
    result["functionTTR"] = TTR.functionTtr(wordsAfterLemma, kkma)

    # nounTtr ----------------------------------------------------------------------------
    # uniqueNoun,nounNum,
    result["nounTTR"] = TTR.nounTtr(wordsAfterLemma, kkma)
    # verbTtr
    result["verbTTR"] = TTR.verbTtr(wordsAfterLemma, kkma)
    # adjTtr
    result["adjTTR"] = TTR.adjTtr(wordsAfterLemma, kkma)
    # advTtr
    result["advTTR"] = TTR.advTtr(wordsAfterLemma, kkma)

    # advTtr
    result["bigramLemmaTTR"] = TTR.bigramLemmaTtr(wordsAfterLemma)
    # advTtr
    result["trigramLemmaTTR"] = TTR.trigramLemmaTtr(wordsAfterLemma)

    # conjuctions ------------------------------------------------------------------------
    result["conjuctions"] = conjuctions(kkma, wordsAfterLemma, words)

    return result


def processSimilarity(text):
    result = collections.defaultdict()

    # topic & similarity -----------------------------------------------------------------
    key_model = BertModel.from_pretrained("skt/kobert-base-v1")
    kw_model = KeyBERT(key_model)
    simil_model = similarity.model()
    result["average_sentence_similarity"], result["topic_consistency"] = similarity.similar(text, simil_model, kw_model)

    return result


def processAdjacency(kkma_list):
    result = collections.defaultdict()

    # All lemmas -------------------------------------------------------------------------
    result["adjacent_sentence_overlap_all_lemmas"] = 0
    result["adjacent_sentence_overlap_all_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_all_lemmas"] = 0

    result["adjacent_two_sentence_overlap_all_lemmas"] = 0
    result["adjacent_two_sentence_overlap_all_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_all_lemmas"] = 0

    # content lemmas ---------------------------------------------------------------------
    result["adjacent_sentence_overlap_content_lemmas"] = 0
    result["adjacent_sentence_overlap_content_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_content_lemmas"] = 0

    result["adjacent_two_sentence_overlap_content_lemmas"] = 0
    result["adjacent_two_sentence_overlap_content_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_content_lemmas"] = 0

    # function lemmas --------------------------------------------------------------------
    result["adjacent_sentence_overlap_function_lemmas"] = 0
    result["adjacent_sentence_overlap_function_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_function_lemmas"] = 0

    result["adjacent_two_sentence_overlap_function_lemmas"] = 0
    result["adjacent_two_sentence_overlap_function_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_function_lemmas"] = 0

    # noun lemmas ------------------------------------------------------------------------
    result["adjacent_sentence_overlap_noun_lemmas"] = 0
    result["adjacent_sentence_overlap_noun_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_noun_lemmas"] = 0

    result["adjacent_two_sentence_overlap_noun_lemmas"] = 0
    result["adjacent_two_sentence_overlap_noun_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_noun_lemmas"] = 0

    # verb lemmas ------------------------------------------------------------------------
    result["adjacent_sentence_overlap_verb_lemmas"] = 0
    result["adjacent_sentence_overlap_verb_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_verb_lemmas"] = 0

    result["adjacent_two_sentence_overlap_verb_lemmas"] = 0
    result["adjacent_two_sentence_overlap_verb_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_verb_lemmas"] = 0

    # adjective lemmas -------------------------------------------------------------------
    result["adjacent_sentence_overlap_adjective_lemmas"] = 0
    result["adjacent_sentence_overlap_adjective_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_adjective_lemmas"] = 0

    result["adjacent_two_sentence_overlap_adjective_lemmas"] = 0
    result["adjacent_two_sentence_overlap_adjective_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_adjective_lemmas"] = 0

    # adverb lemmas ----------------------------------------------------------------------
    result["adjacent_sentence_overlap_adverb_lemmas"] = 0
    result["adjacent_sentence_overlap_adverb_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_adverb_lemmas"] = 0

    result["adjacent_two_sentence_overlap_adverb_lemmas"] = 0
    result["adjacent_two_sentence_overlap_adverb_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_adverb_lemmas"] = 0

    # -------------------------------------------------------------------------------------
    for idx in range(len(kkma_list) - 1):
        result["adjacent_sentence_overlap_all_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_all_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_all_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_all_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])
        result[
            "binary_adjacent_sentence_overlap_all_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_all_lemmas(kkma_list[idx], kkma_list[idx + 1])

        # --------------------------------------------------------------------------------
        result["adjacent_sentence_overlap_content_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_content_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_content_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_content_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])
        result[
            "binary_adjacent_sentence_overlap_content_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_content_lemmas(kkma_list[idx], kkma_list[idx + 1])

        # --------------------------------------------------------------------------------
        result[
            "adjacent_sentence_overlap_function_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_function_lemmas(kkma_list[idx], kkma_list[idx + 1])
        result[
            "adjacent_sentence_overlap_function_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_function_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])
        result[
            "binary_adjacent_sentence_overlap_function_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_function_lemmas(kkma_list[idx], kkma_list[idx + 1])

        # --------------------------------------------------------------------------------
        result["adjacent_sentence_overlap_noun_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_noun_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_noun_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_noun_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])
        result[
            "binary_adjacent_sentence_overlap_noun_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_noun_lemmas(kkma_list[idx], kkma_list[idx + 1])

        # --------------------------------------------------------------------------------
        result["adjacent_sentence_overlap_verb_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_verb_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_verb_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_verb_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])
        result[
            "binary_adjacent_sentence_overlap_verb_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_verb_lemmas(kkma_list[idx], kkma_list[idx + 1])

        # --------------------------------------------------------------------------------
        result[
            "adjacent_sentence_overlap_adjective_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_adjective_lemmas(kkma_list[idx], kkma_list[idx + 1])
        result[
            "adjacent_sentence_overlap_adjective_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_adjective_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])
        result[
            "binary_adjacent_sentence_overlap_adjective_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_adjective_lemmas(kkma_list[idx], kkma_list[idx + 1])

        # --------------------------------------------------------------------------------
        result["adjacent_sentence_overlap_adverb_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_adverb_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_adverb_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_adverb_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])
        result[
            "binary_adjacent_sentence_overlap_adverb_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_adverb_lemmas(kkma_list[idx], kkma_list[idx + 1])

    # -------------------------------------------------------------------------------------
    for idx in range(len(kkma_list) - 2):
        result["adjacent_two_sentence_overlap_all_lemmas"] += adjacent_overlap.adjacent_two_sentence_overlap_all_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "adjacent_two_sentence_overlap_all_lemmas_normed"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_all_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "binary_adjacent_two_sentence_overlap_all_lemmas"
        ] += adjacent_overlap.binary_adjacent_two_sentence_overlap_all_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_two_sentence_overlap_content_lemmas"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_content_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "adjacent_two_sentence_overlap_content_lemmas_normed"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_content_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )

        result[
            "binary_adjacent_two_sentence_overlap_content_lemmas"
        ] += adjacent_overlap.binary_adjacent_two_sentence_overlap_content_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_two_sentence_overlap_function_lemmas"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_function_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "adjacent_two_sentence_overlap_function_lemmas_normed"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_function_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "binary_adjacent_two_sentence_overlap_function_lemmas"
        ] += adjacent_overlap.binary_adjacent_two_sentence_overlap_function_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_two_sentence_overlap_noun_lemmas"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_noun_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "adjacent_two_sentence_overlap_noun_lemmas_normed"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_noun_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "binary_adjacent_two_sentence_overlap_noun_lemmas"
        ] += adjacent_overlap.binary_adjacent_two_sentence_overlap_noun_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_two_sentence_overlap_verb_lemmas"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_verb_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "adjacent_two_sentence_overlap_verb_lemmas_normed"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_verb_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "binary_adjacent_two_sentence_overlap_verb_lemmas"
        ] += adjacent_overlap.binary_adjacent_two_sentence_overlap_verb_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_two_sentence_overlap_adjective_lemmas"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_adjective_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "adjacent_two_sentence_overlap_adjective_lemmas_normed"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_adjective_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "binary_adjacent_two_sentence_overlap_adjective_lemmas"
        ] += adjacent_overlap.binary_adjacent_two_sentence_overlap_adjective_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_two_sentence_overlap_adverb_lemmas"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_adverb_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "adjacent_two_sentence_overlap_adverb_lemmas_normed"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_adverb_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )
        result[
            "binary_adjacent_two_sentence_overlap_adverb_lemmas"
        ] += adjacent_overlap.binary_adjacent_two_sentence_overlap_adverb_lemmas(
            kkma_list[idx], kkma_list[idx + 1], kkma_list[idx + 2]
        )

    return result


def process(text, targets):
    # kkma = inference.inf(text)
    morph = mecab()

    result = collections.defaultdict()

    # text preprocessing -----------------------------------------------------------------
    sentences = textpreprocess.splitText(text)
    words = textpreprocess.splitSen(sentences)

    kkma = []
    kkma_list = []

    for idx, sentence in enumerate(sentences):
        inf = morph.pos(sentence)
        kkma_list.append(inf)
        kkma += kkma_list[idx]

    # processing -------------------------------------------------------------------------
    with ThreadPoolExecutor(max_workers=2) as executor:
        if "ttr" in targets:
            threadTTR = executor.submit(processTTR, kkma, words)
            result.update(threadTTR.result())

        if "similarity" in targets:
            threadSimilarity = executor.submit(processSimilarity, text)
            result.update(threadSimilarity.result())

        if "adjacency" in targets:
            threadAdjacency = executor.submit(processAdjacency, kkma_list)
            result.update(threadAdjacency.result())

        # v1.1 추가 ------------------------------------------------------------------------
        if "list" in targets:
            threadLst = executor.submit(counter.counter, text, sentences, words, kkma, kkma_list)
            result.update(threadLst.result())

    return result
