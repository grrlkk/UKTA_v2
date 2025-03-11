# UKTA Backend

- FastAPI

## Setup

Create environment and install dependencies

```bash
pip install -r requirements.txt
```

Run backend API server with 2 workers

```bash
nohup python -m gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --reload main:app > gunicorn.log 2>&1 &
```
