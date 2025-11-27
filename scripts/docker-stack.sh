#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
ENV_FILE="${ROOT_DIR}/.env.docker"

usage() {
  echo "사용법: $0 {start|stop|restart|logs|ps|build}"
  exit 1
}

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "docker-compose.yml을 찾을 수 없습니다: ${COMPOSE_FILE}"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo ".env.docker 파일이 필요합니다. .env.docker.example을 복사해 만들어 주세요."
  exit 1
fi

compose_cmd() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

ACTION="${1:-}"

case "${ACTION}" in
  start)
    compose_cmd up -d --build
    ;;
  stop)
    compose_cmd down
    ;;
  restart)
    compose_cmd down
    compose_cmd up -d --build
    ;;
  logs)
    compose_cmd logs -f
    ;;
  ps)
    compose_cmd ps
    ;;
  build)
    compose_cmd build
    ;;
  *)
    usage
    ;;
esac
