import os
from typing import Optional

from bareunpy import Corrector, Tagger


class bareun:
    """Bareun 클라이언트. Tagger/Corrector는 지연 초기화해 import 시 오류를 피한다."""

    def __init__(self):
        api_key = os.getenv("BAREUN_API_KEY", "koba-QUS4QWA-2ASEQVQ-U55HLPY-R2E5UOA")
        host = os.getenv("BAREUN_HOST", "localhost")
        port = int(os.getenv("BAREUN_PORT", "5656"))
        try:
            self._tagger: Optional[Tagger] = Tagger(api_key, host, port)
            self._corrector: Optional[Corrector] = Corrector(api_key, host, port)
        except Exception as exc:  # noqa: BLE001
            # 사용 시점에 명확히 실패시키기 위해 None으로 보관
            self._tagger = None
            self._corrector = None
            # 메시지 최소화: 호출 시에만 상세 예외를 다시 던진다.
            self._init_error = exc
        else:
            self._init_error = None

    def _require_client(self):
        if self._tagger is None or self._corrector is None:
            raise RuntimeError(f"Bareun 서버 초기화 실패: {self._init_error}")

    def morphs(self, text):
        self._require_client()
        return self._tagger.morphs(text)

    def nouns(self, text):
        self._require_client()
        return self._tagger.nouns(text)

    def pos(self, text):
        self._require_client()
        return self._tagger.pos(text)

    def tag(self, text):
        self._require_client()
        return self._tagger.tag(text)

    def tags(self, text):
        self._require_client()
        return self._tagger.tags(text)

    def correction(self, text):
        self._require_client()
        return self._corrector.correct_error(content=text)

    def corrections(self, text):
        self._require_client()
        return self._corrector.correct_error_list(contents=text)
