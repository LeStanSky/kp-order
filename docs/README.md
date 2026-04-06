# KPOrder -- документация

## Навигация

| Документ                       | Описание                      |
| ------------------------------ | ----------------------------- |
| [onboarding.md](onboarding.md) | Руководство для пользователей |

---

## Быстрый старт (разработка)

### Предварительные требования

- Docker (для PostgreSQL и Redis)
- Node.js 22+
- pnpm

### Запуск

```bash
# 1. Запустить БД и Redis (WSL или Linux)
docker compose up -d

# 2. Установить зависимости
pnpm install

# 3. Скопировать и заполнить .env
cp backend/.env.example backend/.env
# Заполнить MOYSKLAD_TOKEN если нужна реальная синхронизация
# ERP_TYPE=mock -- для разработки без МойСклад

# 4. Применить миграции и заполнить начальные данные
pnpm --filter backend exec prisma migrate dev
pnpm --filter backend exec prisma db seed

# 5. Запустить backend
pnpm --filter backend dev   # http://localhost:3000

# 6. Запустить frontend (в отдельном терминале)
pnpm --filter frontend dev  # http://localhost:5173
```

### Тестовые пользователи (после seed)

| Email                  | Пароль      | Роль    |
| ---------------------- | ----------- | ------- |
| admin@erpstock.local   | password123 | ADMIN   |
| manager@erpstock.local | password123 | MANAGER |
| client1@erpstock.local | password123 | CLIENT  |
| client2@erpstock.local | password123 | CLIENT  |

### Тесты

```bash
pnpm --filter backend test   # 361 тест
pnpm --filter frontend test  # 198 тестов
```

---

## Статус разработки

| Фаза                             | Статус      |
| -------------------------------- | ----------- |
| Инфраструктура                   | Done        |
| Backend MVP (продукты, заказы)   | Done        |
| Детали продукта (фото, хар-ки)   | Done        |
| Оповещения об остатках           | Done        |
| Управление пользователями        | Done        |
| Пользовательское тестирование    | В процессе  |
| Автоматизация заказов в МойСклад | Планируется |
