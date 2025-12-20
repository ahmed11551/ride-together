# Восстановление удаленных файлов проекта

## Что случилось
Локальные файлы проекта были удалены.

## Решения

### Вариант 1: Восстановление из Git (если есть репозиторий)

```bash
cd /Users/ahmeddevops/Desktop/ride
git clone <ваш-репозиторий> ride-together-restored
# Или если репозиторий уже есть
cd ride-together-restored
git pull
```

### Вариант 2: Скопировать с сервера обратно

```bash
# На сервере
cd /var/www/ride-together
tar -czf /tmp/ride-together-server.tar.gz .

# Скачать на Mac
scp root@194.67.124.123:/tmp/ride-together-server.tar.gz ~/Desktop/
cd ~/Desktop/ride
tar -xzf ride-together-server.tar.gz
```

### Вариант 3: Скачать с GitHub (если загружено)

Если проект был загружен в GitHub:
```bash
cd /Users/ahmeddevops/Desktop/ride
git clone <github-url> ride-together
```

## Приоритет: Исправить работу приложения на сервере

Сначала исправьте ошибку `req.headers.get` на сервере, затем восстанавливайте локальные файлы.

