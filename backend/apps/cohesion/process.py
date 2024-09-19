import collections
import logging
import multiprocessing
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

from apps.morph.bareun import bareun
from keybert import KeyBERT
from transformers import BertModel

from . import TTR, adjacent_overlap, counter, similarity, textpreprocess

logging.basicConfig(level=logging.INFO)


def initialize_models():
    global key_model, kw_model, simil_model, device
    device = "cuda"

    key_model = BertModel.from_pretrained("skt/kobert-base-v1")
    kw_model = KeyBERT(model=key_model)

    simil_model = similarity.model()
    simil_model.to(device)


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
    result["lemmaCnt"] = len(wordsAfterLemma)  # 어절 수

    # TTR --------------------------------------------------------------------------------
    # lemmattr
    result["lemmaTTR"] = TTR.lemmaTtr(wordsAfterLemma)  # 어휘 다양성
    # lemma_mattr
    result["lemmaMTTR"] = TTR.lemmaMattr(wordsAfterLemma)  # 어휘 다양성
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
    # topic & similarity -----------------------------------------------------------------
    result = collections.defaultdict()
    result["average_sentence_similarity"], result["topic_consistency"] = (
        similarity.similar(text, simil_model, kw_model, device=device)
    )

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
        result[
            "adjacent_sentence_overlap_all_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_all_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_all_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_all_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "binary_adjacent_sentence_overlap_all_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_all_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_sentence_overlap_content_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_content_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_content_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_content_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "binary_adjacent_sentence_overlap_content_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_content_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_sentence_overlap_function_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_function_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_function_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_function_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "binary_adjacent_sentence_overlap_function_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_function_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_sentence_overlap_noun_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_noun_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_noun_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_noun_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "binary_adjacent_sentence_overlap_noun_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_noun_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_sentence_overlap_verb_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_verb_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_verb_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_verb_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "binary_adjacent_sentence_overlap_verb_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_verb_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_sentence_overlap_adjective_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_adjective_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_adjective_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_adjective_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "binary_adjacent_sentence_overlap_adjective_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_adjective_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

        # --------------------------------------------------------------------------------
        result[
            "adjacent_sentence_overlap_adverb_lemmas"
        ] += adjacent_overlap.adjacent_sentence_overlap_adverb_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "adjacent_sentence_overlap_adverb_lemmas_normed"
        ] += adjacent_overlap.adjacent_sentence_overlap_adverb_lemmas_normed(
            kkma_list[idx], kkma_list[idx + 1]
        )
        result[
            "binary_adjacent_sentence_overlap_adverb_lemmas"
        ] += adjacent_overlap.binary_adjacent_sentence_overlap_adverb_lemmas(
            kkma_list[idx], kkma_list[idx + 1]
        )

    # -------------------------------------------------------------------------------------
    for idx in range(len(kkma_list) - 2):
        result[
            "adjacent_two_sentence_overlap_all_lemmas"
        ] += adjacent_overlap.adjacent_two_sentence_overlap_all_lemmas(
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


def process(text, targets=["ttr", "similarity", "adjacency", "basic"]):
    # kkma = inference.inf(text)
    morph = bareun()

    result = collections.defaultdict()

    # text preprocessing -----------------------------------------------------------------
    sentences = textpreprocess.splitText(text)
    words = textpreprocess.splitSen(sentences)

    kkma = []
    kkma_simple = []
    kkma_list = []

    result["morpheme"] = morph.tags(sentences).as_json()

    for idx, sentence in enumerate(sentences):
        inf = morph.pos(sentence)
        inf_simple = morph.pos(sentence)
        kkma_list.append(inf)
        kkma += kkma_list[idx]
        kkma_simple += inf_simple

    # Determine the number of workers
    num_workers = min(2, multiprocessing.cpu_count())

    # processing -------------------------------------------------------------------------
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = {}

        if "ttr" in targets:
            curr_time = time.time()
            futures["ttr"] = executor.submit(processTTR, kkma, words.copy())

        if "similarity" in targets:
            curr_time = time.time()
            futures["similarity"] = executor.submit(processSimilarity, text)

        if "adjacency" in targets:
            curr_time = time.time()
            if len(kkma_list) < 2:
                result["adjacency"] = []
            else:
                futures["adjacency"] = executor.submit(processAdjacency, kkma_list)

        # v1.1 추가 ------------------------------------------------------------------------
        if "basic" in targets:
            curr_time = time.time()
            futures["basic"] = executor.submit(
                counter.counter, text, sentences, words, kkma, kkma_list, kkma_simple
            )

        for key, future in futures.items():
            logging.info(f"Waiting for {key} to complete...")
            result[key] = future.result()
            logging.info(f"{key} completed. {time.time() - curr_time}")

        if "basic" in targets and "basic" in futures:
            temp = result["basic"]
            result.pop("basic")
            result["basic_count"] = temp["basic_count"]
            result["basic_density"] = temp["basic_density"]
            result["basic_level"] = temp["basic_level"]	
            result["basic_list"] = temp["basic_list"]
    return result
