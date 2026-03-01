# Демо-деплой (временный): GitHub Pages + Render + Neon + Upstash

> Этот документ описывает **временное** решение для демонстрации приложения до получения VPS.
> Продакшен-деплой см. в [`deploy.md`](./deploy.md).

---

## Архитектура

```
Браузер
  │
  ├── Frontend (статика) ──► GitHub Pages
  │     https://lestandsky.github.io/kp-order/
  │
  └── API-запросы ──► Render (Node.js backend)
                         │
                         ├── PostgreSQL ──► Neon (free tier)
                         └── Redis      ──► Upstash (free tier)
```

> Репозиторий: https://github.com/LeStanSky/kp-order
> GitHub Pages использует username в нижнем регистре: `lestandsky.github.io`

### Ограничения free-tier

| Сервис       | Ограничение                                                               |
| ------------ | ------------------------------------------------------------------------- |
| Render       | Backend "засыпает" через 15 мин неактивности → первый запрос ждёт ~30 сек |
| Neon         | 0.5 GB хранилище, 191 часов compute/месяц                                 |
| Upstash      | 10 000 команд/день, 256 MB                                                |
| GitHub Pages | Только статика, нет SSR                                                   |

---

## Шаг 1: Neon — PostgreSQL

1. Зарегистрируйся на [neon.tech](https://neon.tech)
2. Создай проект: **New Project** → имя `kp-order`
3. Скопируй **Connection string** (формат `postgresql://user:pass@host/dbname?sslmode=require`)
4. Сохрани — понадобится в Шаге 3

---

## Шаг 2: Upstash — Redis

1. Зарегистрируйся на [upstash.com](https://upstash.com)
2. **Create Database** → имя `kp-order`, регион ближе к Render (EU Frankfurt)
3. Скопируй **Redis URL** (формат `rediss://default:pass@host:port`)
4. Сохрани — понадобится в Шаге 3

---

## Шаг 3: Render — Backend

### 3.1 Создание Web Service

1. Зарегистрируйся на [render.com](https://render.com), подключи GitHub аккаунт
2. **New → Web Service** → выбери репозиторий `LeStanSky/kp-order`
3. Настройки:

| Поле           | Значение                                                                         |
| -------------- | -------------------------------------------------------------------------------- |
| Name           | `kp-order-backend`                                                               |
| Root Directory | `backend`                                                                        |
| Runtime        | Node                                                                             |
| Build Command  | `npm install -g pnpm && pnpm install && pnpm exec prisma generate && pnpm build` |
| Start Command  | `node dist/server.js`                                                            |
| Instance Type  | Free                                                                             |

### 3.2 Переменные окружения

В Render → **Environment** → добавь:

```env
NODE_ENV=production
PORT=10000

# JWT (сгенерируй: openssl rand -hex 64)
JWT_SECRET=<сгенерируй>
JWT_REFRESH_SECRET=<сгенерируй>

# Из Шага 1 (Neon)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Из Шага 2 (Upstash)
REDIS_URL=rediss://default:pass@host:port

# МойСклад (для демо можно оставить mock)
ERP_TYPE=mock

# Email (для демо можно отключить)
SMTP_ENABLED=false
OPERATOR_EMAIL=your@email.com

# CORS — URL GitHub Pages
FRONTEND_URL=https://lestandsky.github.io

UPLOAD_DIR=uploads
LOG_LEVEL=info
```

> **ERP_TYPE=mock** — синхронизация использует тестовые данные из seed.
> Для реальных данных замени на `moysklad` и добавь `MOYSKLAD_TOKEN`.

### 3.3 Первый деплой и миграции

После деплоя выполни через Render Shell (**Shell** вкладка):

```bash
npx prisma migrate deploy
npx prisma db seed
```

Запомни URL сервиса: `https://kp-order-backend.onrender.com` (или аналогичный — покажет Render).

---

## Шаг 4: GitHub Pages — Frontend

### 4.1 Изменения в коде

**`frontend/vite.config.ts`** — добавь `base`:

```ts
export default defineConfig({
  base: '/kp-order/', // ← добавить
  plugins: [react()],
  // ...
});
```

**`frontend/src/api/client.ts`** — добавь поддержку env-переменной для URL backend:

```ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
});
```

**`frontend/public/404.html`** — нужен для SPA-роутинга на GitHub Pages.
При прямом переходе на `/products` GH Pages вернёт 404 — этот файл перехватывает и перенаправляет:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>ERPStock</title>
    <script>
      var l = window.location;
      l.replace(
        l.protocol +
          '//' +
          l.hostname +
          (l.port ? ':' + l.port : '') +
          l.pathname.split('/').slice(0, 2).join('/') +
          '/?/' +
          l.pathname.slice(1).replace(/&/g, '~and~') +
          (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
          l.hash,
      );
    </script>
  </head>
  <body></body>
</html>
```

**`frontend/index.html`** — добавь скрипт декодирования **перед** `<script type="module">`:

```html
<script>
  (function (l) {
    if (l.search[1] === '/') {
      var decoded = l.search
        .slice(1)
        .split('&')
        .map(function (s) {
          return s.replace(/~and~/g, '&');
        })
        .join('?');
      window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash);
    }
  })(window.location);
</script>
```

### 4.2 GitHub Actions workflow

Создай файл `.github/workflows/deploy-demo.yml`:

```yaml
name: Deploy Demo (GitHub Pages)

on:
  push:
    branches: [master]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-demo.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm --filter frontend install

      - name: Build
        run: pnpm --filter frontend build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: frontend/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 4.3 Настройка репозитория

1. GitHub → Settings → **Pages** → Source: **GitHub Actions**
2. GitHub → Settings → **Secrets and variables → Actions** → New secret:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://kp-order-backend.onrender.com` (URL из Шага 3)

### 4.4 Запуск деплоя

```bash
# Зафиксируй изменения кода (п. 4.1) в feature-ветке и смержи в master
# Workflow запустится автоматически после мержа
```

Готовый URL: `https://lestandsky.github.io/kp-order/`

---

## Шаг 5: Первый вход

После `prisma db seed` доступны тестовые пользователи:

| Email                  | Пароль      | Роль    |
| ---------------------- | ----------- | ------- |
| admin@erpstock.local   | Admin123!   | ADMIN   |
| manager@erpstock.local | Manager123! | MANAGER |
| client1@erpstock.local | Client123!  | CLIENT  |
| client2@erpstock.local | Client123!  | CLIENT  |

---

## Диагностика

```bash
# Backend не отвечает
# → Render Dashboard → Logs

# CORS-ошибка в браузере
# → Убедись что FRONTEND_URL в Render = https://lestandsky.github.io

# Белый экран на GitHub Pages
# → Проверь base: '/kp-order/' в vite.config.ts

# 404 при прямом переходе по ссылке
# → Убедись что public/404.html создан и попал в сборку

# Изображения товаров не загружаются — ожидаемо:
# uploads/ на Render ephemeral filesystem, сбрасываются при деплое
# для демо не критично
```

---

## Переход на VPS

При переходе на VPS (см. [`deploy.md`](./deploy.md)):

1. Отключи или удали `.github/workflows/deploy-demo.yml`
2. В `vite.config.ts` убери `base: '/kp-order/'`
3. В `client.ts` верни `baseURL: ''` (Nginx будет проксировать `/api/`)
4. Удали `frontend/public/404.html` и скрипт из `index.html`
