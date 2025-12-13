# Резервное копирование базы данных Supabase

## Автоматические бэкапы

### Pro план и выше
Supabase автоматически создает ежедневные бэкапы для планов Pro ($25/месяц) и выше:
- **Pro план:** Бэкапы хранятся 7 дней
- **Team план:** Бэкапы хранятся 30 дней
- **Enterprise план:** Кастомные настройки

### Бесплатный план (Free Tier)
Автоматические бэкапы **не включены**. Необходимо настроить ручное резервное копирование.

---

## Ручное резервное копирование

### Вариант 1: Через Supabase Dashboard

1. Перейдите в [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **Settings** → **Database**
4. В разделе **Backups** нажмите **Create backup**
5. Дождитесь завершения создания бэкапа
6. Скачайте файл бэкапа (опционально)

### Вариант 2: Через Supabase CLI

```bash
# Установите Supabase CLI (если еще не установлен)
npm install -g supabase

# Войдите в Supabase
supabase login

# Свяжите проект
supabase link --project-ref your-project-ref

# Создайте бэкап
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### Вариант 3: Через pg_dump (прямое подключение)

```bash
# Получите connection string из Supabase Dashboard
# Settings → Database → Connection string → URI

# Создайте бэкап
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -F c \
  -f backup_$(date +%Y%m%d_%H%M%S).dump

# Или в формате SQL
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Автоматизация бэкапов

### Скрипт для автоматического бэкапа (Linux/macOS)

Создайте файл `scripts/backup-db.sh`:

```bash
#!/bin/bash

# Конфигурация
PROJECT_REF="your-project-ref"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Создайте директорию для бэкапов
mkdir -p "$BACKUP_DIR"

# Создайте бэкап через Supabase CLI
supabase db dump -f "$BACKUP_FILE" --project-ref "$PROJECT_REF"

# Сожмите бэкап (опционально)
gzip "$BACKUP_FILE"

# Удалите старые бэкапы (старше 30 дней)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup created: $BACKUP_FILE.gz"
```

Сделайте скрипт исполняемым:
```bash
chmod +x scripts/backup-db.sh
```

### Настройка cron для ежедневных бэкапов

```bash
# Откройте crontab
crontab -e

# Добавьте строку для ежедневного бэкапа в 2:00 ночи
0 2 * * * /path/to/your/project/scripts/backup-db.sh >> /path/to/your/project/backups/backup.log 2>&1
```

### GitHub Actions для автоматических бэкапов

Создайте файл `.github/workflows/backup-db.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Ежедневно в 2:00 UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Позволяет запускать вручную

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Login to Supabase
        run: supabase login --token ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        
      - name: Create backup
        run: |
          mkdir -p backups
          supabase db dump -f backups/backup_$(date +%Y%m%d_%H%M%S).sql \
            --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          
      - name: Upload backup to artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/
          retention-days: 30
```

**Необходимые secrets в GitHub:**
- `SUPABASE_ACCESS_TOKEN` - токен доступа Supabase
- `SUPABASE_PROJECT_REF` - ID проекта Supabase

---

## Восстановление из бэкапа

### Через Supabase Dashboard

1. Перейдите в **Settings** → **Database** → **Backups**
2. Выберите нужный бэкап
3. Нажмите **Restore**
4. Подтвердите восстановление

⚠️ **Внимание:** Восстановление перезапишет текущую базу данных!

### Через Supabase CLI

```bash
# Восстановите из SQL файла
supabase db reset --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --file backup_20250128_020000.sql
```

### Через psql

```bash
# Восстановите из SQL файла
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < backup_20250128_020000.sql

# Или из сжатого файла
gunzip -c backup_20250128_020000.sql.gz | psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

---

## Рекомендации

### Частота бэкапов
- **Минимум:** Еженедельно для бесплатного плана
- **Рекомендуется:** Ежедневно для активных проектов
- **Критично:** Перед крупными миграциями или обновлениями

### Хранение бэкапов
- Храните бэкапы в безопасном месте (не в репозитории!)
- Используйте шифрование для чувствительных данных
- Храните бэкапы в разных локациях (3-2-1 правило: 3 копии, 2 разных носителя, 1 вне офиса)

### Тестирование восстановления
- Регулярно тестируйте восстановление из бэкапов
- Проверяйте целостность данных после восстановления
- Документируйте процесс восстановления

---

## Мониторинг бэкапов

### Проверка статуса бэкапов

Создайте скрипт для проверки последнего бэкапа:

```bash
#!/bin/bash

BACKUP_DIR="./backups"
LAST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.sql* 2>/dev/null | head -1)

if [ -z "$LAST_BACKUP" ]; then
  echo "ERROR: No backups found!"
  exit 1
fi

LAST_BACKUP_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LAST_BACKUP" 2>/dev/null || stat -c "%y" "$LAST_BACKUP" | cut -d' ' -f1,2)
DAYS_OLD=$(($(date +%s) - $(date -d "$LAST_BACKUP_DATE" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$LAST_BACKUP_DATE" +%s 2>/dev/null) / 86400))

if [ "$DAYS_OLD" -gt 7 ]; then
  echo "WARNING: Last backup is $DAYS_OLD days old!"
  exit 1
else
  echo "OK: Last backup is $DAYS_OLD days old"
  exit 0
fi
```

---

## Дополнительные ресурсы

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)

