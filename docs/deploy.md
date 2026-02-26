# Деплой

## Требования к серверу

- Ubuntu 22.04+ (или любой Linux)
- Docker + Docker Compose
- Node.js 20+ и pnpm (для сборки фронтенда)
- Nginx (для проксирования)
- Доменное имя + SSL (Let's Encrypt)

---

## 1. Подготовка сервера

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# pnpm
npm install -g pnpm

# Клонировать репозиторий
git clone <repo-url> /opt/kporder
cd /opt/kporder
```

---

## 2. Переменные окружения

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Обязательно заполнить:

```env
NODE_ENV=production
PORT=3000

# Генерируй случайные строки: openssl rand -hex 64
JWT_SECRET=<сгенерируй>
JWT_REFRESH_SECRET=<сгенерируй>

DATABASE_URL=postgresql://postgres:<пароль>@localhost:5432/erpstock?schema=public
REDIS_URL=redis://localhost:6379

# МойСклад
ERP_TYPE=moysklad
MOYSKLAD_TOKEN=<токен из МойСклад>

# Email (Яндекс Почта для домена)
SMTP_ENABLED=true
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.ru
SMTP_PASS=<пароль приложения из Яндекс ID>
SMTP_FROM=noreply@yourdomain.ru

# Email менеджера для уведомлений о заказах
OPERATOR_EMAIL=manager@yourdomain.ru

FRONTEND_URL=https://yourdomain.ru
UPLOAD_DIR=uploads
LOG_LEVEL=info
```

> **SMTP_PASS** — это пароль приложения, не пароль почты.
> Получить: Яндекс ID → Безопасность → Пароли приложений → Создать.

---

## 3. Запуск базы данных и Redis

```bash
cd /opt/kporder
docker compose up -d
```

Проверить:

```bash
docker ps  # оба контейнера должны быть Up
```

---

## 4. Сборка и миграции backend

```bash
cd /opt/kporder
pnpm install

# Применить миграции
pnpm --filter backend exec prisma migrate deploy

# Заполнить начальные данные (группы цен, тестовые пользователи)
pnpm --filter backend exec prisma db seed

# Собрать
pnpm --filter backend build
```

---

## 5. Сборка frontend

```bash
# Создать .env.production для frontend (если нужен кастомный API URL)
# По умолчанию Vite использует /api/* через прокси Nginx

pnpm --filter frontend build
# Артефакты: frontend/dist/
```

---

## 6. Запуск backend (systemd)

Создать файл сервиса:

```bash
sudo nano /etc/systemd/system/kporder.service
```

```ini
[Unit]
Description=KPOrder Backend
After=network.target docker.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/kporder/backend
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
EnvironmentFile=/opt/kporder/backend/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable kporder
sudo systemctl start kporder
sudo systemctl status kporder
```

---

## 7. Nginx

```bash
sudo nano /etc/nginx/sites-available/kporder
```

```nginx
server {
    listen 80;
    server_name yourdomain.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.ru;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.ru/privkey.pem;

    # Frontend (статика)
    root /opt/kporder/frontend/dist;
    index index.html;

    # API → backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Загруженные изображения
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
    }

    # SPA — все остальные пути → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Ограничение размера загружаемых файлов
    client_max_body_size 10M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/kporder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

SSL (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.ru
```

---

## 8. Обновление приложения

```bash
cd /opt/kporder
git pull origin master

# Применить новые миграции (если есть)
pnpm --filter backend exec prisma migrate deploy

# Пересобрать backend
pnpm --filter backend build
sudo systemctl restart kporder

# Пересобрать frontend
pnpm --filter frontend build
# Nginx раздаёт статику напрямую — перезапуск не нужен
```

---

## 9. Первый вход после деплоя

После `prisma db seed` создаются тестовые пользователи:

| Email                  | Пароль      | Роль    |
| ---------------------- | ----------- | ------- |
| admin@erpstock.local   | Admin123!   | ADMIN   |
| manager@erpstock.local | Manager123! | MANAGER |
| client1@erpstock.local | Client123!  | CLIENT  |
| client2@erpstock.local | Client123!  | CLIENT  |

> Удали или деактивируй тестовых пользователей перед передачей в продакшен.

---

## Диагностика

```bash
# Логи backend
sudo journalctl -u kporder -f

# Статус контейнеров
docker ps
docker logs erpstock-postgres
docker logs erpstock-redis

# Проверить API
curl -s http://localhost:3000/api/auth/me

# Принудительная синхронизация с МойСклад
# (происходит автоматически при старте и каждые 15 мин)
```
