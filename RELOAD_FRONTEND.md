# Инструкция по загрузке фронтенда на сервер

## Проблема
Архив поврежден при передаче. Нужно загрузить файлы напрямую.

## Решение

### Вариант 1: Загрузите архив через SCP (если работает)

На вашем Mac:
```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together
scp frontend.tar.gz root@194.67.124.123:/tmp/
```

Затем на сервере:
```bash
cd /var/www/ride-together/frontend-dist
rm -rf *
tar -xzf /tmp/frontend.tar.gz
chown -R www-data:www-data .
chmod -R 755 .
```

### Вариант 2: Создать файлы через SSH команды

Если SCP не работает, создайте файлы напрямую на сервере через SSH. Это будет долго, но работает.

Выполните на сервере скрипт из следующего файла.

