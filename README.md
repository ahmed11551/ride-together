# Ride Together

Сервис для поиска попутчиков и совместных поездок.

## 🚀 Запуск на сервере

### Быстрый старт:

```bash
cd /var/www/ride-together/server
chmod +x START_SERVER.sh
./START_SERVER.sh
```

### Или вручную:

```bash
cd /var/www/ride-together/server
npm install
npm run build

# Исправить проблемы после компиляции
sed -i 's/path\.join(__dirname/path.join(process.cwd()/g' dist/index.js
sed -i '/const __filename = fileURLToPath(import\.meta\.url);/d' dist/index.js
sed -i '/const __dirname = dirname(__filename);/d' dist/index.js
find dist -name "*.js" -type f -exec sed -i 's/req\.headers\.get(/req.get(/g' {} \;

# Запустить
pm2 restart ride-backend
```

## 📁 Структура проекта

- `server/` - Backend (Node.js/Express)
- `src/` - Frontend (React/Vite)

## 🔧 Технологии

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL
- Socket.io (WebSocket)
- JWT авторизация

**Frontend:**
- React
- Vite
- TypeScript

## 📝 Примечания

- Проект использует ES модули (`"type": "module"`)
- После компиляции TypeScript автоматически исправляются импорты через `fix-imports.js`
- На сервере нужно дополнительно исправить `__dirname` и `req.headers.get` в скомпилированных файлах
