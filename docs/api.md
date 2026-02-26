# API Reference

Base URL: `http://localhost:3000/api`

Все защищённые эндпоинты требуют заголовок:

```
Authorization: Bearer <accessToken>
```

---

## Auth `/api/auth`

### POST `/auth/login`

Вход в систему.

**Body:**

```json
{ "email": "user@example.com", "password": "password123" }
```

**Response 200:**

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Иван",
    "role": "CLIENT",
    "priceGroupId": "uuid | null",
    "mustChangePassword": false
  }
}
```

### POST `/auth/refresh`

Обновление токенов.

**Body:** `{ "refreshToken": "..." }`
**Response 200:** `{ "accessToken": "...", "refreshToken": "..." }`

### POST `/auth/logout`

🔒 Инвалидирует refreshToken.

### GET `/auth/me`

🔒 Возвращает текущего пользователя.

### POST `/auth/change-password`

🔒 Смена пароля (обязательна при `mustChangePassword: true`).

**Body:** `{ "currentPassword": "...", "newPassword": "..." }`

---

## Products `/api/products`

### GET `/products`

🔒 Список товаров с пагинацией.

**Query params:**
| Параметр | Тип | По умолчанию | Описание |
|------------|--------|--------------|-----------------------------|
| `page` | number | 1 | |
| `limit` | number | 20 (max 100) | |
| `search` | string | — | Поиск по названию |
| `category` | string | — | Фильтр по категории |
| `sortBy` | string | `cleanName` | Поле сортировки |
| `sortOrder`| string | `asc` | `asc` / `desc` |

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Jaws Weizen PET KEG 20 л. / 2026-08-15",
      "cleanName": "Jaws Weizen алк.5,1% 20 л.",
      "category": "Jaws Розлив",
      "unit": "дкл",
      "expiryDate": "2026-08-15T00:00:00.000Z",
      "imageUrl": null,
      "stocks": [{ "warehouse": "Склад 1", "quantity": 12 }],
      "prices": [{ "priceGroup": { "name": "Прайс основной" }, "value": 2500, "currency": "RUB" }]
    }
  ],
  "total": 145,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### GET `/products/categories`

🔒 Список категорий.
**Response:** `{ "data": ["Jaws", "Jaws Розлив", "Lapochka", ...] }`

### GET `/products/:id`

🔒 Один товар.

### PATCH `/products/:id`

🔒 ADMIN. Редактирование товара (описание, характеристики).

**Body:** `{ "description": "...", "characteristics": { "abv": "5.1%" } }`

### POST `/products/:id/image`

🔒 ADMIN. Загрузка изображения. `multipart/form-data`, поле `image` (JPEG/PNG/WebP, max 5MB).

### DELETE `/products/:id/image`

🔒 ADMIN. Удаление изображения.

---

## Orders `/api/orders`

### POST `/orders`

🔒 CLIENT. Создание заказа.

**Body:**

```json
{
  "items": [{ "productId": "uuid", "quantity": 3 }],
  "comment": "Необязательный комментарий"
}
```

**Response 201:** объект заказа с `orderNumber` (формат `ORD-YYYYMMDD-XXXX`).

### GET `/orders`

🔒 Список заказов.

- CLIENT видит только свои заказы
- MANAGER видит заказы своих клиентов
- ADMIN видит все

**Query:** `page`, `limit`, `status` (`PENDING` / `CONFIRMED` / `SHIPPED` / `DELIVERED` / `CANCELLED`)

### GET `/orders/:id`

🔒 Один заказ с позициями.

### PATCH `/orders/:id/cancel`

🔒 CLIENT или ADMIN. Отмена заказа (только если статус `PENDING`).

### POST `/orders/:id/repeat`

🔒 CLIENT. Повторить заказ (создаёт новый с теми же позициями).

### DELETE `/orders/:id`

🔒 ADMIN. Жёсткое удаление заказа.

---

## Stock Alerts `/api/stock-alerts`

### POST `/stock-alerts`

🔒 MANAGER / ADMIN. Создание оповещения.

**Body:** `{ "productId": "uuid", "minStock": 5 }`

### GET `/stock-alerts`

🔒 MANAGER / ADMIN.

- MANAGER видит только свои оповещения
- ADMIN видит все

### GET `/stock-alerts/:id`

🔒 MANAGER / ADMIN.

### PATCH `/stock-alerts/:id`

🔒 MANAGER / ADMIN. Обновление (`minStock`, `isActive`).

### DELETE `/stock-alerts/:id`

🔒 MANAGER / ADMIN.

---

## Users `/api/users`

> Все эндпоинты только для ADMIN.

### GET `/users`

Список всех пользователей.

### GET `/users/:id`

Один пользователь.

### POST `/users`

Создание пользователя.

**Body:**

```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "password": "TempPass123!",
  "role": "CLIENT",
  "managerId": "uuid | null",
  "priceGroupId": "uuid | null"
}
```

Созданный пользователь получает `mustChangePassword: true`.

### PATCH `/users/:id`

Редактирование пользователя.

**Body (все поля опциональны):**

```json
{
  "name": "...",
  "email": "...",
  "role": "CLIENT | MANAGER | ADMIN",
  "isActive": true,
  "managerId": "uuid | null",
  "priceGroupId": "uuid | null"
}
```

### POST `/users/:id/reset-password`

Сброс пароля. Устанавливает `mustChangePassword: true`.

**Body:** `{ "password": "NewTemp123!" }`

---

## Price Groups `/api/price-groups`

### GET `/price-groups`

🔒 ADMIN. Список групп цен.

**Response:**

```json
[
  { "id": "uuid", "name": "Прайс основной" },
  { "id": "uuid", "name": "Прайс Спот" }
]
```

---

## Коды ошибок

| HTTP | Описание                                    |
| ---- | ------------------------------------------- |
| 400  | Bad Request — неверные данные               |
| 401  | Unauthorized — нет/просроченный токен       |
| 403  | Forbidden — недостаточно прав               |
| 404  | Not Found                                   |
| 409  | Conflict — дубль (email, алерт на продукт)  |
| 422  | Unprocessable Entity — ошибка валидации Zod |
| 500  | Internal Server Error                       |

Формат ошибки:

```json
{ "error": "Описание ошибки" }
```
