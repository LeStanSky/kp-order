# Архитектура KPOrder

## Обзор системы

KPOrder — веб-приложение для оформления заказов на основе остатков товаров из МойСклад.
Клиенты просматривают каталог, добавляют товары в корзину и отправляют заказы менеджерам.

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│  Frontend       │──────▶│  Backend API         │──────▶│  PostgreSQL     │
│  React + Vite   │       │  Express 5 + Prisma  │       │  (Docker)       │
│  :5173          │       │  :3000               │       │  :5432          │
└─────────────────┘       └──────────────────────┘       └─────────────────┘
                                    │                     ┌─────────────────┐
                                    ├───────────────────▶│  Redis          │
                                    │                     │  (Docker)       │
                                    │                     │  :6379          │
                                    │                     └─────────────────┘
                                    │                     ┌─────────────────┐
                                    └───────────────────▶│  МойСклад API   │
                                                          │  (внешний)      │
                                                          └─────────────────┘
```

## Стек технологий

### Backend (`/backend`)

| Компонент  | Технология                    |
| ---------- | ----------------------------- |
| Runtime    | Node.js + TypeScript          |
| Framework  | Express 5                     |
| ORM        | Prisma 7 (PostgreSQL 15)      |
| Queue      | BullMQ (Redis 7)              |
| Auth       | JWT (access 7d + refresh 30d) |
| Validation | Zod                           |
| Email      | Nodemailer (SMTP Яндекс)      |
| Logging    | Winston                       |
| Tests      | Jest 30 + Supertest           |

### Frontend (`/frontend`)

| Компонент    | Технология                 |
| ------------ | -------------------------- |
| Framework    | React 19 + TypeScript      |
| Build        | Vite                       |
| UI           | MUI v7                     |
| State        | Zustand v5                 |
| Server state | TanStack Query v5          |
| HTTP         | Axios                      |
| Forms        | React Hook Form + Zod      |
| Tests        | Vitest 4 + Testing Library |

## Роли пользователей

| Роль      | Доступ                                                  |
| --------- | ------------------------------------------------------- |
| `CLIENT`  | Каталог товаров, корзина, свои заказы                   |
| `MANAGER` | Все заказы своих клиентов, оповещения об остатках       |
| `ADMIN`   | Всё + управление пользователями, редактирование товаров |

## Структура директорий

```
kp-order/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Схема БД
│   │   ├── migrations/          # Миграции
│   │   └── seed.ts              # Начальные данные
│   └── src/
│       ├── config/              # env, database, redis
│       ├── controllers/         # HTTP-обработчики
│       ├── services/            # Бизнес-логика
│       ├── repositories/        # Работа с БД (Prisma)
│       ├── routes/              # Express-роуты
│       ├── middlewares/         # auth, validation, permissions
│       ├── validators/          # Zod-схемы
│       ├── integrations/erp/    # Провайдеры МойСклад / Mock
│       ├── jobs/                # BullMQ-воркеры
│       └── utils/               # logger, errors, expiryParser
└── frontend/
    └── src/
        ├── api/                 # Axios-клиент + методы API
        ├── components/          # Общие компоненты (Header, ProtectedRoute...)
        ├── hooks/               # TanStack Query хуки
        ├── pages/               # Страницы приложения
        ├── store/               # Zustand (authStore, cartStore, themeStore)
        └── config/              # theme.ts
```

## Слои backend (порядок вызовов)

```
Request → Route → Middleware (auth, validate) → Controller → Service → Repository → Prisma → PostgreSQL
```

## Фоновые задачи (BullMQ)

| Задача         | Расписание    | Описание                                        |
| -------------- | ------------- | ----------------------------------------------- |
| `product-sync` | каждые 15 мин | Синхронизация товаров и остатков из МойСклад    |
| `stock-alerts` | каждый час    | Проверка остатков, отправка email при нарушении |

## Синхронизация с МойСклад

1. `GET /entity/assortment` → список товаров с UUID и ценами → upsert в `products` + `prices`
2. `GET /report/stock/all` → остатки по складам → парсинг срока годности из названия → upsert в `stocks`
3. Инвалидация кэша Redis (`products:*`, `categories`)

`externalId` продукта = UUID из МойСклад (неизменяемый). Срок годности парсится из поля `name` в отчёте об остатках (формат `"Название / YYYY-MM-DD"`).

## Кэширование (Redis)

- Список товаров: ключи `products:{queryHash}`, TTL 5 мин
- Список категорий: ключ `categories`, TTL 5 мин
- Нумерация заказов: ключ `order:counter` (Redis INCR)
- Cooldown email-оповещений: ключ `alert:cooldown:{alertId}`, TTL 24 ч

## Аутентификация

- `POST /api/auth/login` → возвращает `accessToken` (7d) + `refreshToken` (30d)
- `accessToken` хранится в `localStorage` (Zustand persist)
- При 401 — автоматический refresh через interceptor Axios
- `mustChangePassword: true` → принудительный редирект на `/change-password`
