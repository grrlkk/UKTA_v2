import collections
from apps.morph.morph import mecab
import pandas as pd
from keybert import KeyBERT
from transformers import BertModel

from . import TTR, adjacent_overlap, similarity, textpreprocess, topic

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


def process(text):
    # kkma = inference.inf(text)
    morph = mecab()

    result = collections.defaultdict()

    # text 전처리
    # 문장 나누기
    sentences = textpreprocess.splitText(text)
    kkma = []
    kkma_list = []

    for idx, sentence in enumerate(sentences):
        inf = morph.pos(sentence)
        kkma_list.append(inf)
        kkma += kkma_list[idx]

    # 단어 나누기
    words = textpreprocess.splitSen(sentences)

    # lemmazation
    wordsAfterLemma = textpreprocess.lemma(words)
    result["lemmaCnt"] = len(wordsAfterLemma)

    # topic& similar
    key_model = BertModel.from_pretrained("skt/kobert-base-v1")
    kw_model = KeyBERT(key_model)
    simil_model = similarity.model()
    result["average_sentence_similarity"], result["topic_consistency"] = similarity.similar(text, simil_model, kw_model)

    # conjuctions
    result["conjuctions"] = conjuctions(kkma, wordsAfterLemma, words)

    # TTR
    # lemmattr
    result["lemmattr"] = TTR.lemmaTtr(wordsAfterLemma)
    # lemma_mattr
    result["lemmaMattr"] = TTR.lemmaMattr(wordsAfterLemma)
    # lexical_density_tokens
    result["lexicalDensityTokens"] = TTR.lexicalDensityTokens(wordsAfterLemma, kkma)
    # lexical_density_tokens
    result["lexicalDensityTypes"] = TTR.lexicalDensityTypes(wordsAfterLemma, kkma)
    # contentTtr
    result["contentTtr"] = TTR.contentTtr(wordsAfterLemma, kkma)
    # functionTtr
    result["functionTtr"] = TTR.functionTtr(wordsAfterLemma, kkma)

    # nounTtr
    # uniqueNoun,nounNum,
    result["nounTtr"] = TTR.nounTtr(wordsAfterLemma, kkma)
    # verbTtr
    result["verbTtr"] = TTR.verbTtr(wordsAfterLemma, kkma)
    # adjTtr
    result["adjTtr"] = TTR.adjTtr(wordsAfterLemma, kkma)
    # advTtr
    result["advTtr"] = TTR.advTtr(wordsAfterLemma, kkma)

    # advTtr
    result["bigramLemmaTtr"] = TTR.bigramLemmaTtr(wordsAfterLemma)
    # advTtr
    result["trigramLemmaTtr"] = TTR.trigramLemmaTtr(wordsAfterLemma)

    # All lemmas
    result["adjacent_sentence_overlap_all_lemmas"] = 0
    result["adjacent_sentence_overlap_all_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_all_lemmas"] = 0
    result["adjacent_two_sentence_overlap_all_lemmas"] = 0
    result["adjacent_two_sentence_overlap_all_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_all_lemmas"] = 0

    for idx in range(len(sentences) - 1):
        result["adjacent_sentence_overlap_all_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_all_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        result[
            "adjacent_sentence_overlap_all_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_all_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])

        result[
            "binary_adjacent_sentence_overlap_all_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_all_lemmas(kkma_list[idx], kkma_list[idx + 1])

    for idx in range(len(sentences) - 2):
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

    # content lemmas

    result["adjacent_sentence_overlap_content_lemmas"] = 0
    result["adjacent_sentence_overlap_content_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_content_lemmas"] = 0
    result["adjacent_two_sentence_overlap_content_lemmas"] = 0
    result["adjacent_two_sentence_overlap_content_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_content_lemmas"] = 0

    for idx in range(len(sentences) - 1):
        result["adjacent_sentence_overlap_content_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_content_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        result[
            "adjacent_sentence_overlap_content_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_content_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])

        result[
            "binary_adjacent_sentence_overlap_content_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_content_lemmas(kkma_list[idx], kkma_list[idx + 1])

    for idx in range(len(sentences) - 2):
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

    # function lemmas

    result["adjacent_sentence_overlap_function_lemmas"] = 0
    result["adjacent_sentence_overlap_function_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_function_lemmas"] = 0
    result["adjacent_two_sentence_overlap_function_lemmas"] = 0
    result["adjacent_two_sentence_overlap_function_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_function_lemmas"] = 0

    for idx in range(len(sentences) - 1):
        result[
            "adjacent_sentence_overlap_function_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_function_lemmas(kkma_list[idx], kkma_list[idx + 1])

        result[
            "adjacent_sentence_overlap_function_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_function_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])

        result[
            "binary_adjacent_sentence_overlap_function_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_function_lemmas(kkma_list[idx], kkma_list[idx + 1])

    for idx in range(len(sentences) - 2):
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

    # noun lemmas
    result["adjacent_sentence_overlap_noun_lemmas"] = 0
    result["adjacent_sentence_overlap_noun_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_noun_lemmas"] = 0
    result["adjacent_two_sentence_overlap_noun_lemmas"] = 0
    result["adjacent_two_sentence_overlap_noun_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_noun_lemmas"] = 0

    for idx in range(len(sentences) - 1):
        result["adjacent_sentence_overlap_noun_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_noun_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        result[
            "adjacent_sentence_overlap_noun_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_noun_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])

        result[
            "binary_adjacent_sentence_overlap_noun_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_noun_lemmas(kkma_list[idx], kkma_list[idx + 1])

    for idx in range(len(sentences) - 2):
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

    # verb lemmas

    result["adjacent_sentence_overlap_verb_lemmas"] = 0
    result["adjacent_sentence_overlap_verb_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_verb_lemmas"] = 0
    result["adjacent_two_sentence_overlap_verb_lemmas"] = 0
    result["adjacent_two_sentence_overlap_verb_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_verb_lemmas"] = 0

    for idx in range(len(sentences) - 1):
        result["adjacent_sentence_overlap_verb_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_verb_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        result[
            "adjacent_sentence_overlap_verb_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_verb_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])

        result[
            "binary_adjacent_sentence_overlap_verb_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_verb_lemmas(kkma_list[idx], kkma_list[idx + 1])

    for idx in range(len(sentences) - 2):
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

    # adjective lemmas

    result["adjacent_sentence_overlap_adjective_lemmas"] = 0
    result["adjacent_sentence_overlap_adjective_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_adjective_lemmas"] = 0
    result["adjacent_two_sentence_overlap_adjective_lemmas"] = 0
    result["adjacent_two_sentence_overlap_adjective_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_adjective_lemmas"] = 0

    for idx in range(len(sentences) - 1):
        result[
            "adjacent_sentence_overlap_adjective_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_adjective_lemmas(kkma_list[idx], kkma_list[idx + 1])

        result[
            "adjacent_sentence_overlap_adjective_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_adjective_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])

        result[
            "binary_adjacent_sentence_overlap_adjective_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_adjective_lemmas(kkma_list[idx], kkma_list[idx + 1])

    for idx in range(len(sentences) - 2):
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

    # adverb lemmas
    result["adjacent_sentence_overlap_adverb_lemmas"] = 0
    result["adjacent_sentence_overlap_adverb_lemmas_normed"] = 0
    result["binary_adjacent_sentence_overlap_adverb_lemmas"] = 0
    result["adjacent_two_sentence_overlap_adverb_lemmas"] = 0
    result["adjacent_two_sentence_overlap_adverb_lemmas_normed"] = 0
    result["binary_adjacent_two_sentence_overlap_adverb_lemmas"] = 0

    for idx in range(len(sentences) - 1):
        result["adjacent_sentence_overlap_adverb_lemmas"] += adjacent_overlap.adjacent_sentence_overlap_adverb_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        result[
            "adjacent_sentence_overlap_adverb_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_adverb_lemmas_normed(kkma_list[idx], kkma_list[idx + 1])

        result[
            "binary_adjacent_sentence_overlap_adverb_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_adverb_lemmas(kkma_list[idx], kkma_list[idx + 1])

    for idx in range(len(sentences) - 2):
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

    print("\nresult:")
    print(result)

    return result
