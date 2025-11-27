# 환경 변수 설정 가이드

## 개요

이 프로젝트는 개발 환경과 운영 환경을 분리하여 환경 변수를 관리합니다.

## 환경 파일

- `.env` - 로컬 개발 환경 설정
- `.env.production` - 운영 환경 설정
- `.env.example` - 개발 환경 템플릿 (Git 커밋 가능)
- `.env.production.example` - 운영 환경 템플릿 (Git 커밋 가능)

## 초기 설정

### 1. 개발 환경 설정

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일 수정 (API 키, DB URL 등)
vi .env
```

### 2. 운영 환경 설정

```bash
# .env.production.example을 복사하여 .env.production 파일 생성
cp .env.production.example .env.production

# .env.production 파일 수정 (운영 서버 설정)
vi .env.production
```

## 서버 실행

### 로컬 개발 환경 (기본값)

```bash
# ENV 변수를 설정하지 않으면 자동으로 .env 파일을 로드
python main.py

# 또는 명시적으로 지정
ENV=development python main.py
```

### 운영 환경

```bash
# ENV=production으로 설정하면 .env.production 파일을 로드
ENV=production python main.py
```

### uvicorn 사용 시

```bash
# 개발 환경
uvicorn main:app --reload

# 운영 환경
ENV=production uvicorn main:app --host 0.0.0.0 --port 8000
```

### systemd 또는 서비스 매니저 사용 시

서비스 파일에 환경 변수를 추가:

```ini
[Service]
Environment="ENV=production"
ExecStart=/path/to/python main.py
```

## 환경 변수 확인

현재 로드된 환경을 확인하려면:

```bash
python -c "from config import settings; print(f'ENV: {settings}')"
```

서버 시작 시 다음과 같은 로그가 출력됩니다:

```
Loading environment from: .env (ENV=development)
```

또는

```
Loading environment from: .env.production (ENV=production)
```

## 주의사항

⚠️ **보안 경고**

- `.env`와 `.env.production` 파일은 절대 Git에 커밋하지 마세요
- 이 파일들은 `.gitignore`에 의해 자동으로 무시됩니다
- API 키나 비밀번호 등 민감한 정보가 포함되어 있습니다

✅ **템플릿 파일**

- `.env.example`과 `.env.production.example`은 Git에 커밋 가능합니다
- 실제 값은 포함하지 말고 placeholder만 사용하세요

## 설정 항목

### OpenAI 설정

- `OPENAI_API_KEY` - OpenAI API 키
- `OPENAI_BASE` - API 베이스 URL
- `OPENAI_MODEL` - 사용할 모델
- `OPENAI_TEMPERATURE` - 생성 온도

### MongoDB 설정

- `DB_URL` - MongoDB 연결 URL
- `DB_NAME` - 데이터베이스 이름

### 서버 설정

- `HOST` - 서버 호스트 (기본: 0.0.0.0)
- `PORT` - 서버 포트 (기본: 8000)
- `DEBUG_MODE` - 디버그 모드 (기본: False)

## 문제 해결

### 환경 파일이 로드되지 않는 경우

1. 파일이 backend 디렉토리 루트에 있는지 확인
2. 파일 이름이 정확한지 확인 (`.env` 또는 `.env.production`)
3. ENV 환경 변수가 올바르게 설정되었는지 확인

### 설정이 적용되지 않는 경우

1. 서버를 재시작했는지 확인
2. Python 캐시 파일 삭제: `find . -type d -name __pycache__ -exec rm -r {} +`
3. 환경 변수가 올바른 형식인지 확인
