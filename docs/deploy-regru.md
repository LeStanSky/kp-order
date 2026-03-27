# Деплой KPOrder на Reg.ru — полная инструкция

## Оглавление

1. [Выбор и заказ VPS](#1-выбор-и-заказ-vps)
2. [Привязка домена](#2-привязка-домена)
3. [Первоначальная настройка сервера](#3-первоначальная-настройка-сервера)
4. [Установка зависимостей](#4-установка-зависимостей)
5. [Docker: PostgreSQL + Redis](#5-docker-postgresql--redis)
6. [Деплой приложения](#6-деплой-приложения)
7. [Настройка Nginx + SSL](#7-настройка-nginx--ssl)
8. [Systemd-сервис для backend](#8-systemd-сервис-для-backend)
9. [Проверка работоспособности](#9-проверка-работоспособности)
10. [GitHub Actions CD](#10-github-actions-cd)
11. [Обновление приложения](#11-обновление-приложения)
12. [Бэкапы](#12-бэкапы)
13. [Мониторинг и логи](#13-мониторинг-и-логи)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Выбор и заказ VPS

### Почему VPS, а не виртуальный хостинг

Виртуальный хостинг reg.ru не подходит — он предназначен для PHP-сайтов.
Для Node.js + PostgreSQL + Redis нужен **VPS (Cloud-сервер)**.

### Как заказать

1. Перейти на [reg.ru](https://www.reg.ru/) → **Хостинг** → **Cloud VPS** (или прямая ссылка: reg.ru/vps/)
2. Выбрать тариф:

| Параметр | Минимум для старта | Рекомендация     |
| -------- | ------------------ | ---------------- |
| CPU      | 1 vCPU             | 2 vCPU           |
| RAM      | 2 ГБ               | 4 ГБ             |
| Диск     | 20 ГБ NVMe         | 40 ГБ NVMe       |
| ОС       | Ubuntu 22.04 LTS   | Ubuntu 22.04 LTS |
| Трафик   | Безлимитный        | Безлимитный      |

> **Почему 2 ГБ минимум**: PostgreSQL + Redis + Node.js + Nginx + сборка frontend.
> При 1 ГБ сборка `vite build` может упасть по OOM.
> 4 ГБ — комфортный вариант с запасом под рост.

3. **ОС**: выбрать **Ubuntu 22.04 LTS** (не 24.04 — меньше совместимых пакетов)
4. **Дата-центр**: Москва (ближе к пользователям)
5. Оплатить. После оплаты reg.ru пришлёт на email:
   - IP-адрес сервера
   - root-пароль
   - DNS-серверы (если нужны)

---

## 2. Привязка домена

### Вариант A: Домен куплен на reg.ru

Если домен уже на reg.ru — всё просто:

1. **Личный кабинет reg.ru** → **Домены** → выбрать домен
2. **DNS-серверы** → убедиться, что стоят DNS reg.ru (`ns1.reg.ru`, `ns2.reg.ru`)
3. **Управление зоной** → **Ресурсные записи**:

| Тип | Имя | Значение          | TTL |
| --- | --- | ----------------- | --- |
| A   | @   | `<IP вашего VPS>` | 300 |
| A   | www | `<IP вашего VPS>` | 300 |

4. **Удалить дефолтную A-запись** reg.ru хостинга (обычно указывает на `31.31.198.x`).
   Если оставить две A-записи, DNS будет возвращать оба IP — браузер может попасть
   на панель `dnsadmin.hosting.reg.ru` вместо вашего VPS, и API-запросы фронта уйдут не туда.
5. Подождать 5–15 минут (в рамках reg.ru обычно быстро)

### Вариант B: Домен куплен у другого регистратора

Два способа:

**Способ 1 — Перенести DNS на reg.ru:**

- У текущего регистратора сменить NS-серверы на `ns1.reg.ru`, `ns2.reg.ru`
- В панели reg.ru добавить домен и настроить A-записи как выше

**Способ 2 — Оставить DNS у текущего регистратора:**

- В DNS-панели текущего регистратора создать A-запись `@` → `<IP VPS>`
- Создать A-запись `www` → `<IP VPS>`

### Проверка DNS

```bash
# С локальной машины (через 5-30 мин после настройки)
nslookup yourdomain.ru
# Должен показать ТОЛЬКО IP вашего VPS (одну A-запись).
# Если показывает два IP — удалите лишнюю A-запись в панели DNS.

ping yourdomain.ru
# Должен пинговаться по IP VPS
```

---

## 3. Первоначальная настройка сервера

### 3.1. Подключение по SSH

```bash
# С локальной машины (Windows — через PowerShell, Git Bash или WSL)
ssh root@<IP_VPS>
# Ввести пароль из письма reg.ru
```

### 3.2. Обновление системы

```bash
apt update && apt upgrade -y
```

### 3.3. Создание пользователя (не работать под root)

```bash
adduser deploy
# Задать пароль, остальные поля — Enter
Xs4DeployUser!

# Добавить в sudo и docker группы
usermod -aG sudo deploy

# Разрешить SSH для нового пользователя
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

### 3.4. Настройка SSH-ключей (рекомендуется)

На **локальной машине**:

```bash
# Если ключа ещё нет — сгенерировать
ssh-keygen -t ed25519 -C "deploy@kporder"

# Скопировать публичный ключ на сервер
ssh-copy-id deploy@<IP_VPS>
```

### 3.5. Усиление безопасности SSH

На **сервере** под root:

```bash
nano /etc/ssh/sshd_config
```

Изменить/добавить:

```
PermitRootLogin no
PasswordAuthentication no    # только после настройки SSH-ключа!
PubkeyAuthentication yes
```

```bash
systemctl restart sshd
```

> **Важно**: перед отключением PasswordAuthentication убедитесь,
> что можете войти по ключу: `ssh deploy@<IP_VPS>`

### 3.6. Файрвол (UFW)

```bash
# Под root или через sudo
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

---

## 4. Установка зависимостей

Все команды дальше — **под пользователем deploy**:

```bash
ssh deploy@<IP_VPS>
```

### 4.1. Docker + Docker Compose

```bash
# Установка Docker
curl -fsSL https://get.docker.com | sudo sh

# Добавить deploy в группу docker (чтобы работать без sudo)
sudo usermod -aG docker deploy

# Перелогиниться, чтобы группа применилась
exit
ssh deploy@<IP_VPS>

# Проверка
docker --version
docker compose version
```

### 4.2. Node.js 22 LTS (через nvm)

```bash
# Установить nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Активировать nvm (или перелогиниться)
source ~/.bashrc

# Установить Node.js 22 LTS
nvm install 22
nvm use 22
nvm alias default 22

# Проверка
node --version   # v22.x.x
npm --version
```

### 4.3. pnpm

```bash
npm install -g pnpm

# Проверка
pnpm --version
```

### 4.4. Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 4.5. Certbot (для SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 5. Docker: PostgreSQL + Redis

### 5.1. Создать директорию проекта

```bash
sudo mkdir -p /opt/kporder
sudo chown deploy:deploy /opt/kporder
```

### 5.2. Production docker-compose

Создать файл `/opt/kporder/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: kporder-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: kporder
      POSTGRES_PASSWORD: <СГЕНЕРИРОВАТЬ_НАДЁЖНЫЙ_ПАРОЛЬ>
      POSTGRES_DB: kporder
    ports:
      - '127.0.0.1:5432:5432' # только localhost, не наружу!
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U kporder']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: kporder-redis
    restart: unless-stopped
    ports:
      - '127.0.0.1:6379:6379' # только localhost!
    volumes:
      - redisdata:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

> **Сгенерировать пароль**: `openssl rand -base64 32`
> cJl/Pk1jQZpdNOJvdCDzaQGCGU9SnkEDgH83gfFIJcY=

### 5.3. Запустить

```bash
cd /opt/kporder
docker compose up -d

# Проверить
docker compose ps
# Оба сервиса должны быть Up (healthy)
```

---

## 6. Деплой приложения

### 6.1. Клонировать репозиторий

```bash
cd /opt/kporder
git clone https://github.com/LeStanSky/kp-order.git app
cd app
git checkout master
```

### 6.2. Установить зависимости

```bash
pnpm install
```

### 6.3. Настроить backend .env

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Заполнить:

```env
NODE_ENV=production
PORT=3000

# PostgreSQL (пароль — тот, что задали в docker-compose)
DATABASE_URL=postgresql://kporder:GfhjkmLkzRhfcyjujGhjgtkkthf!@127.0.0.1:5432/kporder?schema=public

# Redis
REDIS_URL=redis://127.0.0.1:6379

# JWT — ОБЯЗАТЕЛЬНО сгенерировать новые!
JWT_SECRET=<openssl rand -hex 64>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<openssl rand -hex 64>
JWT_REFRESH_EXPIRES_IN=30d

# Email (Yandex)
SMTP_ENABLED=true
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.ru
SMTP_PASS=<пароль приложения из Яндекс ID>
SMTP_FROM=noreply@yourdomain.ru
OPERATOR_EMAIL=manager@yourdomain.ru

# МойСклад
ERP_TYPE=moysklad
MOYSKLAD_TOKEN=<токен из МойСклад>
MOYSKLAD_BASE_URL=https://api.moysklad.ru/api/remap/1.2

# Frontend URL (для CORS и ссылок в email)
FRONTEND_URL=https://yourdomain.ru

# Uploads
UPLOAD_DIR=uploads
LOG_LEVEL=info
```

> **Генерация JWT-секретов** (выполнить на сервере):
>
> ```bash
> openssl rand -hex 64
> ```
>
> Выполнить дважды — для JWT_SECRET и JWT_REFRESH_SECRET.

### 6.3.1. Проверить доступность SMTP-портов

> **Важно**: многие хостеры (включая reg.ru) блокируют исходящие SMTP-порты (587, 465)
> на новых серверах по умолчанию. Проверьте доступность **сразу при настройке**, чтобы
> не терять время на диагностику позже.

```bash
nc -zv smtp.yandex.ru 587
# Ожидаемый результат: Connection to smtp.yandex.ru 587 port [tcp/*] succeeded!
# Если "Connection timed out" — порт заблокирован на уровне провайдера.
```

Если порт заблокирован — отправьте заявку в поддержку хостера на разблокировку
исходящих SMTP-портов. Без этого email-уведомления (заказы, stock alerts) работать не будут.

### 6.4. Сгенерировать Prisma-клиент и применить миграции

```bash
pnpm --filter backend exec prisma generate
pnpm --filter backend exec prisma migrate deploy
```

### 6.5. Засеять начальные данные

```bash
pnpm --filter backend exec prisma db seed
```

> Создаст тестовых пользователей (admin/manager/client).
> После первого входа админом — сменить пароли и создать реальных пользователей.

### 6.6. Собрать backend

```bash
pnpm --filter backend build
```

### 6.7. Создать директорию uploads

```bash
mkdir -p /opt/kporder/app/backend/uploads
```

### 6.8. Проверить запуск backend

```bash
cd /opt/kporder/app/backend
node dist/server.js
# Должен написать: Server is running on port 3000
# Ctrl+C — остановить (потом запустим через systemd)
```

### 6.9. Собрать frontend

```bash
cd /opt/kporder/app
pnpm --filter frontend build
# Результат: frontend/dist/
```

---

## 7. Настройка Nginx + SSL

### 7.1. Конфигурация Nginx

```bash
sudo nano /etc/nginx/sites-available/kporder
```

Вставить (заменить `yourdomain.ru` на ваш домен):

```nginx
server {
    listen 80;
    server_name yourdomain.ru www.yourdomain.ru;

    # Для получения SSL-сертификата (certbot)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Редирект на HTTPS (включить после получения сертификата)
    # location / {
    #     return 301 https://$host$request_uri;
    # }

    # --- Временно: работа по HTTP до получения SSL ---
    root /opt/kporder/app/frontend/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    # Uploads proxy
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    client_max_body_size 10M;
}
```

### 7.2. Активировать конфигурацию

```bash
# Включить сайт
sudo ln -s /etc/nginx/sites-available/kporder /etc/nginx/sites-enabled/

# Убрать default
sudo rm -f /etc/nginx/sites-enabled/default

# Проверить конфигурацию
sudo nginx -t

# Перезапустить
sudo systemctl reload nginx
```

### 7.3. Проверить HTTP

Открыть в браузере: `http://yourdomain.ru` — должен загрузиться frontend.

### 7.4. Получить SSL-сертификат

```bash
sudo certbot --nginx -d yourdomain.ru -d www.yourdomain.ru
# Следовать инструкциям:
# - Ввести email
# - Согласиться с ToS
# - Выбрать редирект HTTP → HTTPS (рекомендуется)
```

Certbot автоматически:

- Получит сертификат Let's Encrypt
- Модифицирует конфигурацию Nginx (добавит SSL-блок)
- Настроит auto-renewal (проверить: `sudo certbot renew --dry-run`)

> **Не забудьте** обновить `FRONTEND_URL` в `backend/.env` с `http://` на `https://`
> и перезапустить backend — иначе CORS будет блокировать запросы из браузера:
>
> ```bash
> sed -i 's|FRONTEND_URL=http://|FRONTEND_URL=https://|' /opt/kporder/app/backend/.env
> sudo systemctl restart kporder
> ```

### 7.5. Финальная конфигурация Nginx (после certbot)

Certbot создаст конфигурацию автоматически. Убедиться, что она содержит:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.ru www.yourdomain.ru;

    ssl_certificate /etc/letsencrypt/live/yourdomain.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /opt/kporder/app/frontend/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    # Uploads proxy
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    client_max_body_size 10M;
}

server {
    listen 80;
    server_name yourdomain.ru www.yourdomain.ru;
    return 301 https://$host$request_uri;
}
```

---

## 8. Systemd-сервис для backend

### 8.1. Создать unit-файл

```bash
sudo nano /etc/systemd/system/kporder.service
```

```ini
[Unit]
Description=KPOrder Backend API
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/kporder/app/backend
ExecStart=/home/deploy/.nvm/versions/node/v22.16.0/bin/node dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=kporder
EnvironmentFile=/opt/kporder/app/backend/.env

# Безопасность
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/opt/kporder/app/backend/uploads /opt/kporder/app/backend/logs

[Install]
WantedBy=multi-user.target
```

> **Важно**: путь к node — узнать точный командой:
>
> ```bash
> which node
> # Пример: /home/deploy/.nvm/versions/node/v22.16.0/bin/node
> ```
>
> Подставить свой путь в `ExecStart`.

### 8.2. Запустить сервис

```bash
sudo systemctl daemon-reload
sudo systemctl enable kporder
sudo systemctl start kporder

# Проверить статус
sudo systemctl status kporder
# Должно быть: active (running)

# Посмотреть логи
sudo journalctl -u kporder -f
```

---

## 9. Проверка работоспособности

### Чек-лист

```bash
# 1. Docker-контейнеры работают
docker compose -f /opt/kporder/docker-compose.yml ps

# 2. Backend отвечает
curl http://127.0.0.1:3000/api/products/categories

# 3. Nginx отвечает
curl -I https://yourdomain.ru

# 4. API через Nginx
curl https://yourdomain.ru/api/products/categories

# 5. Systemd-сервис работает
sudo systemctl status kporder

# 6. SSL-сертификат валиден
curl -vI https://yourdomain.ru 2>&1 | grep "SSL certificate"
```

### Проверка в браузере

1. Открыть `https://yourdomain.ru` — должна загрузиться страница логина
2. Войти как `admin@erpstock.local` / `Admin123!`
3. Проверить каталог, заказы, алерты
4. Создать реальных пользователей, сменить пароли тестовых

---

## 10. GitHub Actions CD

### 10.1. Настроить GitHub Secrets

В репозитории: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret     | Значение                                               |
| ---------- | ------------------------------------------------------ |
| `SSH_HOST` | IP-адрес VPS                                           |
| `SSH_USER` | `deploy`                                               |
| `SSH_KEY`  | Содержимое приватного ключа (без passphrase, см. ниже) |
| `SSH_PORT` | `22` (или ваш порт)                                    |

> **Важно**: ключ для CD **должен быть без passphrase** — `appleboy/ssh-action` не поддерживает
> интерактивный ввод пароля и упадёт с ошибкой `ssh: this private key is passphrase protected`.
>
> Рекомендуется сгенерировать **отдельный ключ** для CD:
>
> ```bash
> # На локальной машине (Linux/macOS)
> ssh-keygen -t ed25519 -C "github-actions-cd" -f ~/.ssh/kporder_cd -N ""
>
> # На Windows PowerShell — без флага -N, нажать Enter дважды при запросе passphrase:
> ssh-keygen -t ed25519 -C "github-actions-cd" -f $HOME/.ssh/kporder_cd
> ```
>
> Добавить публичный ключ на сервер:
>
> ```bash
> # Linux/macOS
> ssh-copy-id -i ~/.ssh/kporder_cd.pub deploy@<IP_VPS>
>
> # Windows PowerShell
> type $HOME\.ssh\kporder_cd.pub | ssh deploy@<IP_VPS> "cat >> ~/.ssh/authorized_keys"
> ```
>
> Скопировать **приватный** ключ в GitHub Secret `SSH_KEY`:
>
> ```bash
> cat ~/.ssh/kporder_cd
> ```
>
> Скопировать **весь текст** включая `-----BEGIN/END-----`.

### 10.2. deploy.yml

Файл `.github/workflows/deploy.yml` уже настроен:

```yaml
name: Deploy

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

            cd /opt/kporder/app

            # Pull latest
            git pull origin master

            # Install deps
            pnpm install --frozen-lockfile

            # Backend
            pnpm --filter backend exec prisma generate
            pnpm --filter backend exec prisma migrate deploy
            pnpm --filter backend build

            # Frontend
            pnpm --filter frontend build

            # Restart backend
            sudo systemctl restart kporder

            echo "Deploy complete!"
```

### 10.3. Sudoers для deploy (без пароля на restart)

На сервере:

```bash
sudo visudo -f /etc/sudoers.d/kporder
```

Добавить:

```
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart kporder
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl status kporder
```

Теперь `deploy` может перезапускать сервис без ввода пароля.

---

## 11. Обновление приложения

### Ручное обновление

```bash
ssh deploy@<IP_VPS>
cd /opt/kporder/app

git pull origin master
pnpm install --frozen-lockfile

# Backend
pnpm --filter backend exec prisma generate
pnpm --filter backend exec prisma migrate deploy
pnpm --filter backend build
sudo systemctl restart kporder

# Frontend (если менялся)
pnpm --filter frontend build
# Nginx подхватит автоматически — статика раздаётся из frontend/dist/
```

### Автоматическое (через CD)

Просто смержить PR в `master` — GitHub Actions выполнит деплой автоматически.

---

## 12. Бэкапы

### 12.1. Скрипт бэкапа БД

```bash
sudo mkdir -p /opt/kporder/backups
sudo chown deploy:deploy /opt/kporder/backups

nano /opt/kporder/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/kporder/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=14

# Бэкап PostgreSQL
docker exec kporder-postgres pg_dump -U kporder kporder \
  | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Бэкап uploads
tar czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" \
  -C /opt/kporder/app/backend uploads/

# Удалить старые бэкапы
find "$BACKUP_DIR" -name "*.gz" -mtime +$KEEP_DAYS -delete

echo "Backup completed: $TIMESTAMP"
```

```bash
chmod +x /opt/kporder/backup.sh
```

### 12.2. Cron (ежедневно в 3:00)

```bash
crontab -e
```

Добавить:

```
0 3 * * * /opt/kporder/backup.sh >> /opt/kporder/backups/backup.log 2>&1
```

### 12.3. Восстановление из бэкапа

```bash
# Распаковать и восстановить БД
gunzip -c /opt/kporder/backups/db_XXXXXXXX.sql.gz \
  | docker exec -i kporder-postgres psql -U kporder kporder
```

---

## 13. Мониторинг и логи

### Логи backend

```bash
# Realtime
sudo journalctl -u kporder -f

# Последние 100 строк
sudo journalctl -u kporder -n 100

# За сегодня
sudo journalctl -u kporder --since today
```

### Логи Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Логи Docker (БД / Redis)

```bash
docker logs -f kporder-postgres
docker logs -f kporder-redis
```

### Мониторинг ресурсов

```bash
# Общая нагрузка
htop

# Место на диске
df -h

# Docker volumes
docker system df
```

### Проверка auto-renewal SSL

```bash
sudo certbot renew --dry-run
# Должно пройти без ошибок (certbot обновляет сертификат автоматически)
```

---

## 14. Troubleshooting

### Backend не запускается

```bash
# Проверить логи
sudo journalctl -u kporder -n 50

# Частые причины:
# 1. Неправильный DATABASE_URL → проверить пароль в .env и docker-compose
# 2. Docker не запущен → sudo systemctl start docker
# 3. Порт занят → sudo lsof -i :3000
```

### 502 Bad Gateway в Nginx

```bash
# Backend не запущен или упал
sudo systemctl status kporder
sudo systemctl restart kporder

# Проверить что backend слушает порт
curl http://127.0.0.1:3000/api/products/categories
```

### БД не подключается

```bash
# Проверить что контейнер работает
docker ps

# Проверить подключение
docker exec -it kporder-postgres psql -U kporder -c "SELECT 1;"

# Перезапустить
docker compose -f /opt/kporder/docker-compose.yml restart postgres
```

### Сертификат не обновляется

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Нехватка памяти при сборке frontend

```bash
# Добавить swap (если нет)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Сделать постоянным
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Повторить сборку
pnpm --filter frontend build
```

### Email-уведомления не отправляются (SMTP)

```bash
# Проверить доступность SMTP-порта
nc -zv smtp.yandex.ru 587

# Если "Connection timed out" — порт заблокирован провайдером.
# Отправить заявку в поддержку на разблокировку исходящих SMTP-портов (587, 465).

# Проверить логи backend на ошибки SMTP
sudo journalctl -u kporder -o cat | grep -i smtp
```

> Многие хостеры блокируют SMTP-порты на новых серверах для защиты от спама.
> Это нужно проверять сразу при настройке сервера (см. [шаг 6.3.1](#631-проверить-доступность-smtp-портов)).

### Права доступа к uploads

```bash
sudo chown -R deploy:deploy /opt/kporder/app/backend/uploads
chmod 755 /opt/kporder/app/backend/uploads
```

---

## Краткая шпаргалка

| Действие              | Команда                                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Перезапустить backend | `sudo systemctl restart kporder`                                                                                                                                     |
| Логи backend          | `sudo journalctl -u kporder -f`                                                                                                                                      |
| Перезапустить Nginx   | `sudo systemctl reload nginx`                                                                                                                                        |
| Перезапустить БД      | `docker compose -f /opt/kporder/docker-compose.yml restart`                                                                                                          |
| Статус всех сервисов  | `sudo systemctl status kporder nginx docker`                                                                                                                         |
| Ручной бэкап          | `/opt/kporder/backup.sh`                                                                                                                                             |
| Обновить приложение   | `cd /opt/kporder/app && git pull && pnpm install --frozen-lockfile && pnpm --filter backend build && sudo systemctl restart kporder && pnpm --filter frontend build` |
