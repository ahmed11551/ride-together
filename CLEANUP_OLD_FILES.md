# Очистка старых/дублирующихся файлов

## 📁 Файлы которые можно удалить (опционально):

### Директория `server/` - дублирующиеся скрипты:

**Можно удалить (старые/дублирующиеся):**
- `CHECK_DNS.sh` - дубликат `CHECK_DNS_STATUS.sh`
- `CHECK_SERVER_NOW.sh` - был создан для разовой проверки
- `CHECK_STATUS.sh` - дубликат
- `DEPLOY_FIX_TO_SERVER.sh` - использовался для разового деплоя
- `DIRECT_FIX.sh` - старый скрипт
- `EXECUTE_ON_SERVER.sh` - использовался для разового исправления
- `FINAL_CHECK.sh` - разовая проверка
- `FINAL_FIX.py` - старый скрипт
- `FIX_SERVER_NOW.sh` - был использован для исправления
- `fix-dirname-on-server.sh` - уже исправлено
- `fix-server-deployment.sh` - старый скрипт
- `QUICK_FIX_COMMAND.txt` - использовано
- `QUICK_FIX.sh` - старый скрипт
- `QUICK_FIX_SERVER.md` - использовано
- `run-on-server.sh` - устаревший
- `SERVER_FIX_INSTRUCTIONS.md` - использовано
- `SERVER_UPDATE.md` - использовано
- `update-on-server.sh` - устаревший
- `URGENT_FIX.sh` - использовано

**Оставить (актуальные):**
- `CHECK_DNS_STATUS.sh` - для проверки DNS
- `rebuild-server.sh` - основной скрипт пересборки
- `fix-imports.js` - используется при сборке
- `setup-domain.sh` - для настройки домена
- `setup-telegram-bot.sh` - для настройки бота
- Все `.md` файлы с документацией
- Все конфигурационные файлы (.conf, .cjs, .json, .ts)

### Директория корень - документация:

**Можно удалить (дублирующиеся/старые):**
- `ALL_COMPLETED.md` - исторический файл
- `COMPLETED_TODAY.md` - исторический файл
- `FINAL_STATUS.md` - можно удалить после аудита
- `TELEGRAM_BOT_SETUP.md` - дубликат `TELEGRAM_BOT_COMPLETE.md`
- `TELEGRAM_BOT_READY.md` - дубликат
- `GENERATE_ICONS.md` - дубликат `CREATE_ICONS.md`
- `ICONS_SETUP.md` - дубликат
- `PROJECT_IMPROVEMENTS.md` - можно объединить с другими

**Оставить:**
- `CODE_AUDIT_REPORT.md` - актуальный отчет
- `CREATE_ICONS.md` - инструкция
- `README.md` - основной README
- `TELEGRAM_BOT_COMPLETE.md` - полная документация
- `SERVER_STATUS.md` - текущий статус

## ⚠️ Внимание:

**НЕ УДАЛЯЙТЕ:**
- Любые файлы в `src/`, `public/`, `server/api/`
- Конфигурационные файлы (.json, .ts, .cjs)
- Активные скрипты и документацию
- Миграции базы данных

## 🔧 Команда для безопасной очистки:

```bash
cd /Users/ahmeddevops/Desktop/ride/ride-together

# Создать резервную копию (опционально)
# tar -czf backup-$(date +%Y%m%d).tar.gz server/

# Удалить старые скрипты (ВНИМАТЕЛЬНО - проверьте список выше!)
cd server
rm -f CHECK_DNS.sh CHECK_SERVER_NOW.sh CHECK_STATUS.sh DEPLOY_FIX_TO_SERVER.sh \
     DIRECT_FIX.sh EXECUTE_ON_SERVER.sh FINAL_CHECK.sh FINAL_FIX.py \
     FIX_SERVER_NOW.sh fix-dirname-on-server.sh fix-server-deployment.sh \
     QUICK_FIX_COMMAND.txt QUICK_FIX.sh QUICK_FIX_SERVER.md \
     run-on-server.sh SERVER_FIX_INSTRUCTIONS.md SERVER_UPDATE.md \
     update-on-server.sh URGENT_FIX.sh

cd ..
rm -f ALL_COMPLETED.md COMPLETED_TODAY.md FINAL_STATUS.md \
      TELEGRAM_BOT_SETUP.md TELEGRAM_BOT_READY.md \
      GENERATE_ICONS.md ICONS_SETUP.md PROJECT_IMPROVEMENTS.md
```

## ✅ После очистки:

Проект будет содержать только актуальные файлы, что упростит навигацию и поддержку.

