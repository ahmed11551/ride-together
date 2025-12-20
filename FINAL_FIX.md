# Финальное исправление ошибки ERR_INVALID_URL

## Проблема
Ошибка: `ERR_INVALID_URL` с input `'/api/rides?limit=1'` в строке 12 скомпилированного файла `dist/api/rides/list.js`

## Решение

### Вариант 1: Проверить проблемный код (диагностика)

На сервере выполните:
```bash
ssh root@194.67.124.123
cd /var/www/ride-together/server
head -30 dist/api/rides/list.js | cat -n
```

Ищите использование `new URL(` на строке 12 или рядом.

### Вариант 2: Пересобрать код полностью (рекомендуется)

1. Загрузите скрипт пересборки:
```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together
scp server/REBUILD_AND_FIX.sh root@194.67.124.123:/tmp/
```

2. На сервере выполните:
```bash
ssh root@194.67.124.123
chmod +x /tmp/REBUILD_AND_FIX.sh
/tmp/REBUILD_AND_FIX.sh
```

### Вариант 3: Ручное исправление

Если проблема в использовании `new URL()` с относительным путём, нужно исправить на сервере:

```bash
ssh root@194.67.124.123
cd /var/www/ride-together/server

# Найдите строку с new URL
grep -n "new URL" dist/api/rides/list.js

# Исправьте её вручную (замените относительный путь на полный URL или используйте другой подход)
# Например, если там что-то вроде:
# new URL('/api/rides?limit=1')
# Замените на использование req.query напрямую (как и должно быть)
```

## Быстрая проверка после исправления

```bash
# На сервере
curl -s "http://localhost:3001/api/rides?limit=1" | head -c 200
```

Должен вернуться JSON с массивом поездок, а не ошибка.

