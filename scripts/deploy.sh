#!/usr/bin/env bash
# Обёртка — полный деплой на VPS
exec "$(dirname "$0")/deploy-server.sh" "$@"
