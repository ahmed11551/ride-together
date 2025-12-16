# 🗄️ Настройка PostgreSQL базы данных на Timeweb

## Данные подключения

```
Host: 9d497bc2bf9dd679bd9834af.twc1.net
Port: 5432
Database: default_db
User: gen_user
Password: fn)un5%40K2oLrBJ
SSL: verify-full
SSL Certificate: $HOME/.cloud-certs/root.crt
```

## Connection String

```
postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full
```

**ВАЖНО:** Пароль уже содержит URL-encoded символы (`%40` = `@`)

## Environment Variables для Backend

Добавьте в Timeweb Dashboard → Backend App → Environment Variables:

```bash
# Database Connection
DATABASE_URL=postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full

# SSL Certificate (если нужно)
PGSSLROOTCERT=/path/to/root.crt
```

## SSL Certificate

Если Timeweb требует SSL сертификат:

1. **Скачайте сертификат** с Timeweb Dashboard
2. **Сохраните** в безопасное место на сервере
3. **Укажите путь** в `PGSSLROOTCERT`

Или используйте переменную окружения:
```bash
export PGSSLROOTCERT=$HOME/.cloud-certs/root.crt
```

## Проверка подключения

### Локально (если нужно протестировать):

```bash
export PGSSLROOTCERT=$HOME/.cloud-certs/root.crt
psql 'postgresql://gen_user:fn)un5%40K2oLrBJ@9d497bc2bf9dd679bd9834af.twc1.net:5432/default_db?sslmode=verify-full'
```

### Через Node.js (в backend):

Backend автоматически использует `DATABASE_URL` из переменных окружения.

## Миграции

После подключения к базе, нужно применить миграции:

1. **Найдите SQL миграции** в `supabase/migrations/` или `TIMEWEB_FULL_SCHEMA.sql`
2. **Примените их** к новой базе данных
3. **Проверьте**, что все таблицы созданы

## Безопасность

⚠️ **ВАЖНО:** 
- НЕ коммитьте пароли в Git
- Используйте Environment Variables
- Храните SSL сертификаты в безопасном месте
- Ограничьте доступ к базе данных по IP (если возможно)
