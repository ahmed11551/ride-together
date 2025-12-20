# Инструкция по загрузке frontend на сервер

## Шаг 1: На вашем Mac (откройте новый терминал на Mac)

```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together
scp frontend-fixed.tar.gz root@194.67.124.123:/tmp/
```

Введите пароль когда попросит.

## Шаг 2: На сервере (где вы сейчас находитесь)

После того как файл загрузится, выполните:

```bash
cd /var/www/ride-together/frontend-dist
rm -rf *
tar -xzf /tmp/frontend-fixed.tar.gz
chown -R www-data:www-data .
chmod -R 755 .

# Проверка
ls -la *.png *.ico 2>/dev/null | head -5
```

## Альтернатива: Если файл уже есть на сервере

Если файл уже был загружен ранее, просто выполните шаг 2.

