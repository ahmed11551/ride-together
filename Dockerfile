# Dockerfile для фронтенда (React/Vite)
# Используется для деплоя на Timeweb Cloud

FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production=false

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Production stage
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию Nginx для SPA
COPY nginx-timeweb.conf /etc/nginx/conf.d/default.conf

# Копируем .htaccess для Apache (если используется)
COPY .htaccess /usr/share/nginx/html/.htaccess

# Открываем порт
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
