# Удаление иконок с сервера

## Шаг 1: Загрузите обновлённый frontend

На вашем Mac:
```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together
scp frontend-no-icons.tar.gz root@194.67.124.123:/tmp/
```

## Шаг 2: На сервере удалите иконки и обновите frontend

```bash
# Удаление иконок с сервера
cd /var/www/ride-together/frontend-dist
rm -f icon-192.png icon-512.png

# Обновление frontend
rm -rf *
tar -xzf /tmp/frontend-no-icons.tar.gz
chown -R www-data:www-data .
chmod -R 755 .

# Проверка что иконки удалены
ls -la *.png 2>/dev/null || echo "✅ PNG иконки удалены"
ls -la *.ico 2>/dev/null | head -2
```

## Результат

- ✅ icon-192.png удалена
- ✅ icon-512.png удалена
- ✅ favicon.ico остаётся
- ✅ Все ссылки на иконки удалены из кода

