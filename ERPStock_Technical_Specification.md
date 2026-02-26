# Техническое задание: Приложение для работы с МойСклад/ERP

## 1. Общая информация о проекте

### 1.1 Название проекта

**ERPStock** - веб-приложение для автоматизации работы с остатками товаров и заказами из ERP-систем (МойСклад, 1С)

### 1.2 Цель проекта

Создать веб-приложение, которое упростит процесс предоставления информации об остатках товаров клиентам и автоматизирует процесс приема заказов.

### 1.3 Бизнес-задачи

- Устранить ручную выгрузку и отправку остатков клиентам
- Автоматизировать обработку заказов
- Обеспечить разным группам клиентов доступ к своим ценам
- Предоставить менеджерам инструменты контроля остатков и сроков годности
- Снизить время обработки запросов клиентов с часов до минут

### 1.4 Текущая проблема

**До внедрения:**

- Менеджеры вручную скачивают остатки из МойСклад
- Остатки отправляются клиентам по email/мессенджерам
- Заказы принимаются по телефону/email и вручную вносятся в систему
- Нет контроля за сроками годности товаров
- Нет автоматических уведомлений о низких остатках

**После внедрения:**

- Клиенты видят актуальные остатки в режиме реального времени
- Заказы создаются клиентами самостоятельно
- Автоматическая отправка заказов операторам
- Контроль сроков годности и остатков
- История заказов и возможность повтора

---

## 2. Функциональные требования

### 2.1 Этапы разработки

#### **Этап 1: MVP - Просмотр остатков (4-6 недель)**

**Функционал:**

- Регистрация и авторизация пользователей (JWT)
- Синхронизация товаров из ERP (автоматическая каждые 15 минут)
- Парсинг и скрытие сроков годности из названий товаров для обычных клиентов
- Отображение каталога товаров с фильтрацией по категориям
- Поиск по товарам
- Дифференцированные цены по группам клиентов
- Просмотр остатков в реальном времени

**Роли:**

- **Клиент** - видит товары без сроков годности, цены своей группы
- **Менеджер** - видит товары со сроками годности, предупреждения о подходящих сроках
- **Администратор** - полный доступ ко всем данным, управление пользователями

**Критерии готовности:**

- ✅ Пользователь может зарегистрироваться и войти
- ✅ Каталог обновляется автоматически из ERP
- ✅ Клиенты видят товары без СГ, менеджеры - с СГ
- ✅ Цены отображаются в зависимости от группы клиента
- ✅ Работает поиск и фильтрация

#### **Этап 2: Оформление заказов (3-4 недели)**

**Функционал:**

- Корзина товаров
- Оформление заказа с комментарием
- Автоматическая отправка заказа на email оператора
- История заказов клиента
- Повтор предыдущих заказов одной кнопкой
- Просмотр всех заказов для менеджеров (READ ONLY, только своих клиентов)

**Email уведомления:**

- Оператору при создании нового заказа
- Клиенту с подтверждением заказа

**Критерии готовности:**

- ✅ Клиент может добавить товары в корзину и оформить заказ
- ✅ Оператор получает email с деталями заказа
- ✅ Клиент видит историю своих заказов
- ✅ Менеджер видит заказы своих клиентов (READ ONLY)
- ✅ Работает функция повтора заказа

#### **Этап 3: Детализация товаров (2-3 недели)**

**Функционал:**

- Модальное окно с детальной информацией о товаре
- Загрузка и отображение фотографий товаров
- Характеристики товаров (вес, объем, состав и т.д.)
- Связанные товары / рекомендации

**Критерии готовности:**

- ✅ При клике на "Детали" открывается модальное окно
- ✅ Отображается фото, описание, характеристики
- ✅ Можно добавить товар в корзину из модального окна

#### **Этап 4: Уведомления об остатках (1-2 недели)**

**Функционал:**

- Настройка уведомлений о минимальных остатках (для менеджеров и админов)
- Автоматическая проверка остатков каждый час
- Email уведомления при достижении минимального уровня
- История уведомлений
- Управление активными уведомлениями

**Критерии готовности:**

- ✅ Менеджер может настроить минимальный остаток для товара
- ✅ При достижении минимума приходит email
- ✅ Уведомления не дублируются (не чаще 1 раза в 24 часа)

#### **Этап 5: Тестирование с пользователями (2-3 недели)**

**Активности:**

- Alpha-тестирование с 2-3 операторами
- Сбор обратной связи
- Исправление критических ошибок
- UX улучшения
- Beta-тестирование с 10-20 клиентами

**Критерии готовности:**

- ✅ Нет критических ошибок
- ✅ Положительная обратная связь от 80% тестировщиков
- ✅ Производительность: загрузка каталога < 2 сек

#### **Этап 6: Автоматическое размещение заказов в ERP (3-4 недели)**

**Функционал:**

- Создание заказов в ERP через API
- Автоматическое резервирование товаров
- Синхронизация статусов заказов
- Уведомления об изменении статуса заказа
- Интеграция с системой оплаты (опционально)

**Критерии готовности:**

- ✅ Заказ автоматически создается в ERP
- ✅ Статусы синхронизируются в обе стороны
- ✅ Клиент видит актуальный статус заказа

### 2.2 Роли и права доступа

| Функция                              | Клиент | Менеджер       | Администратор |
| ------------------------------------ | ------ | -------------- | ------------- |
| Просмотр товаров БЕЗ СГ              | ✅     | -              | -             |
| Просмотр товаров СО СГ               | -      | ✅             | ✅            |
| Создание заказов                     | ✅     | -              | -             |
| Просмотр своих заказов               | ✅     | -              | ✅            |
| Просмотр всех заказов своих клиентов | -      | ✅ (READ ONLY) | ✅            |
| Настройка уведомлений об остатках    | -      | ✅             | ✅            |
| Управление пользователями            | -      | -              | ✅            |
| Системные настройки                  | -      | -              | ✅            |

### 2.3 Особенности работы со сроками годности

**Парсинг сроков годности:**

- Товары в ERP хранятся с указанием срока годности в названии
- Примеры: "Молоко 3.2% 31.12.2024", "Хлеб белый СГ 15.01.2025"
- Система автоматически извлекает дату и очищает название

**Отображение:**

- Клиенты видят: "Молоко 3.2%"
- Менеджеры видят: "Молоко 3.2%" + бейдж "СГ: 31.12.2024" с цветовой индикацией

**Цветовая индикация для менеджеров:**

- 🟢 Зеленый: > 6 месяцев до истечения
- 🔵 Синий: 3-6 месяцев
- 🟡 Желтый: 1-3 месяца (предупреждение)
- 🟠 Оранжевый: < 1 месяца (критический)
- 🔴 Красный: истек срок годности

---

## 3. Технологический стек

### 3.1 Frontend

```json
{
  "framework": "React 18.3+",
  "language": "TypeScript 5.0+",
  "build": "Vite 5.0+",
  "package_manager": "pnpm",
  "routing": "React Router v6",
  "state_management": "Zustand",
  "data_fetching": "TanStack Query (React Query)",
  "http_client": "Axios",
  "ui_framework": "Material-UI (MUI) v5",
  "forms": "React Hook Form + Zod",
  "tables": "TanStack Table",
  "notifications": "react-hot-toast",
  "date": "date-fns",
  "styling": "MUI System + Emotion"
}
```

### 3.2 Backend

```json
{
  "runtime": "Node.js 20 LTS",
  "framework": "Express.js 4.18+",
  "language": "TypeScript 5.0+",
  "orm": "Prisma 5.0+",
  "database": "PostgreSQL 15+",
  "cache": "Redis 7+",
  "authentication": "jsonwebtoken + bcrypt",
  "validation": "Zod",
  "security": "helmet + cors + express-rate-limit",
  "jobs": "Bull + node-cron",
  "email": "nodemailer + handlebars",
  "logging": "winston",
  "monitoring": "Sentry"
}
```

### 3.3 DevOps

```json
{
  "containerization": "Docker + Docker Compose",
  "ci_cd": "GitHub Actions",
  "hosting": {
    "frontend": "Vercel",
    "backend": "Railway / Render",
    "database": "Railway Postgres",
    "cache": "Upstash Redis"
  },
  "ssl": "Let's Encrypt (автоматически)",
  "monitoring": "Sentry + LogTail",
  "backups": "Automated daily (Railway)"
}
```

### 3.4 Инструменты качества кода

```json
{
  "linting": {
    "frontend": "ESLint + @typescript-eslint",
    "backend": "ESLint + @typescript-eslint",
    "config": "eslint-config-airbnb-typescript"
  },
  "formatting": "Prettier",
  "pre_commit": "Husky + lint-staged",
  "testing": {
    "unit": "Jest + Testing Library",
    "e2e": "Playwright",
    "api": "Supertest",
    "coverage": "Jest (min 80%)"
  },
  "type_checking": "TypeScript strict mode"
}
```

---

## 4. Архитектура системы

### 4.1 Общая архитектура

```
┌─────────────────────────────────────────────────────┐
│                    КЛИЕНТЫ                          │
│          Web Browser (Desktop/Mobile)               │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────┐
│                FRONTEND (React SPA)                  │
│  Deployed on: Vercel                                │
│  • React Router (навигация)                         │
│  • Zustand (глобальное состояние)                   │
│  • TanStack Query (кэш + запросы)                   │
│  • Material-UI (компоненты)                         │
└────────────────────┬────────────────────────────────┘
                     │ REST API + JWT
                     │
┌────────────────────▼────────────────────────────────┐
│           BACKEND (Express + TypeScript)            │
│  Deployed on: Railway                               │
│  • Controllers (HTTP handlers)                      │
│  • Services (бизнес-логика)                         │
│  • Repositories (доступ к данным)                   │
│  • Middleware (auth, validation, errors)            │
└──┬──────────────┬────────────┬─────────────────────┘
   │              │            │
   │              │            │
┌──▼────────┐ ┌──▼────────┐ ┌▼──────────────────────┐
│PostgreSQL │ │   Redis   │ │  Background Jobs      │
│           │ │           │ │  (Bull Queue)         │
│• Products │ │• Sessions │ │                       │
│• Orders   │ │• Cache    │ │• Sync ERP (15 min)   │
│• Users    │ │           │ │• Check alerts (1h)   │
│• Stock    │ │           │ │• Send emails         │
└───────────┘ └───────────┘ └───────────────────────┘
     │
     │
┌────▼────────────────────────────────────────────────┐
│            ВНЕШНИЕ СЕРВИСЫ                          │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ ERP API  │  │  Email   │  │  File Storage   │  │
│  │(МойСклад │  │(SendGrid)│  │  (CloudFlare    │  │
│  │или 1С)   │  │          │  │   R2)           │  │
│  └──────────┘  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 4.2 Структура проекта

```
erpstock/
├── frontend/                      # React приложение
│   ├── src/
│   │   ├── api/                  # API клиенты
│   │   │   ├── client.ts         # Axios instance
│   │   │   ├── auth.api.ts
│   │   │   ├── products.api.ts
│   │   │   ├── orders.api.ts
│   │   │   └── stockAlerts.api.ts
│   │   ├── components/           # Компоненты
│   │   │   ├── common/          # Общие
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   └── LoadingSpinner/
│   │   │   ├── products/        # Товары
│   │   │   │   ├── ProductCard/
│   │   │   │   ├── ProductList/
│   │   │   │   ├── ProductDetail/
│   │   │   │   ├── ExpiryBadge/
│   │   │   │   └── CategoryFilter/
│   │   │   ├── orders/          # Заказы
│   │   │   │   ├── Cart/
│   │   │   │   ├── OrderCard/
│   │   │   │   ├── OrderList/
│   │   │   │   └── OrderDetail/
│   │   │   └── layout/          # Лаяуты
│   │   │       ├── Header/
│   │   │       ├── Sidebar/
│   │   │       └── Footer/
│   │   ├── pages/               # Страницы
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── products/
│   │   │   │   ├── ProductsPage.tsx
│   │   │   │   └── ProductDetailPage.tsx
│   │   │   ├── orders/
│   │   │   │   ├── OrdersPage.tsx
│   │   │   │   ├── OrderDetailPage.tsx
│   │   │   │   └── CartPage.tsx
│   │   │   ├── admin/
│   │   │   │   ├── UsersPage.tsx
│   │   │   │   └── SettingsPage.tsx
│   │   │   └── manager/
│   │   │       └── StockAlertsPage.tsx
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useProducts.ts
│   │   │   ├── useOrders.ts
│   │   │   └── useCart.ts
│   │   ├── store/               # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── cartStore.ts
│   │   │   └── filtersStore.ts
│   │   ├── types/               # TypeScript types
│   │   │   ├── product.types.ts
│   │   │   ├── order.types.ts
│   │   │   ├── user.types.ts
│   │   │   └── api.types.ts
│   │   ├── utils/               # Утилиты
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── config/              # Конфигурация
│   │   │   └── api.config.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                       # Node.js приложение
│   ├── src/
│   │   ├── config/               # Конфигурация
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── email.ts
│   │   ├── controllers/          # HTTP handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── stockAlerts.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── services/             # Бизнес-логика
│   │   │   ├── auth.service.ts
│   │   │   ├── products.service.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── cache.service.ts
│   │   │   └── stockAlerts.service.ts
│   │   ├── repositories/         # Доступ к данным
│   │   │   ├── user.repository.ts
│   │   │   ├── product.repository.ts
│   │   │   ├── order.repository.ts
│   │   │   └── stockAlert.repository.ts
│   │   ├── integrations/         # Внешние интеграции
│   │   │   └── erp/
│   │   │       ├── IERPProvider.ts        # Interface
│   │   │       ├── ERPProviderFactory.ts
│   │   │       └── providers/
│   │   │           ├── MoySkladProvider.ts
│   │   │           └── OneCProvider.ts
│   │   ├── middlewares/          # Middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── permissions.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── rateLimiter.middleware.ts
│   │   ├── validators/           # Zod schemas
│   │   │   ├── auth.validator.ts
│   │   │   ├── order.validator.ts
│   │   │   └── product.validator.ts
│   │   ├── utils/                # Утилиты
│   │   │   ├── expiryParser.ts
│   │   │   ├── orderNumberGenerator.ts
│   │   │   ├── logger.ts
│   │   │   └── errors.ts
│   │   ├── jobs/                 # Background jobs
│   │   │   ├── queues.ts
│   │   │   ├── syncProducts.job.ts
│   │   │   ├── checkStockAlerts.job.ts
│   │   │   └── checkExpiryAlerts.job.ts
│   │   ├── types/                # TypeScript types
│   │   │   ├── express.d.ts
│   │   │   └── erp.types.ts
│   │   ├── routes/               # Express routes
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── products.routes.ts
│   │   │   ├── orders.routes.ts
│   │   │   ├── stockAlerts.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── templates/            # Email templates
│   │   │   ├── order-notification.hbs
│   │   │   └── stock-alert.hbs
│   │   ├── app.ts                # Express app
│   │   └── server.ts             # Entry point
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/                    # Тесты
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── package.json
│
├── docker-compose.yml            # Docker setup
├── .husky/                       # Git hooks
│   ├── pre-commit
│   └── pre-push
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       └── backend-ci.yml
└── README.md
```

### 4.3 ERP Integration Layer (абстракция)

**Принцип Dependency Inversion** - приложение не зависит от конкретной ERP системы.

```typescript
// Единый интерфейс для всех ERP
interface IERPProvider {
  getProducts(options?: GetProductsOptions): Promise<Product[]>;
  getStock(productId?: string): Promise<Stock[]>;
  createOrder(order: Order): Promise<{ id: string; number: string }>;
  syncProducts(): Promise<SyncResult>;
  testConnection(): Promise<boolean>;
  // ... другие методы
}

// Реализации
class MoySkladProvider implements IERPProvider { ... }
class OneCProvider implements IERPProvider { ... }

// Фабрика выбирает провайдера на основе ENV
const erpProvider = ERPProviderFactory.createFromEnv();
```

**Преимущества:**

- ✅ Легкая смена ERP системы (только конфигурация)
- ✅ Можно тестировать с mock-провайдером
- ✅ Возможность работы с несколькими ERP одновременно
- ✅ Независимость бизнес-логики от конкретной системы

### 4.4 База данных (PostgreSQL + Prisma)

**Ключевые таблицы:**

- `users` - пользователи (клиенты, менеджеры, админы)
- `products` - товары с очищенными названиями и сроками годности
- `stock` - остатки и цены по группам клиентов
- `orders` - заказы
- `order_items` - позиции заказов
- `stock_alerts` - настройки уведомлений о минимальных остатках
- `stock_alert_history` - история срабатывания уведомлений

**Индексы:**

- По `email` (users)
- По `cleanName` (products)
- По `expiryDate` (products)
- По `userId + createdAt` (orders)
- По `operatorEmail` (orders)
- По `erpType + erpId` (products)

---

## 5. Стандарты качества кода

### 5.1 Линтеры и форматирование

#### **ESLint конфигурация**

```javascript
// .eslintrc.js (frontend & backend)
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'airbnb-typescript/base',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
  },
};
```

#### **Prettier конфигурация**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### 5.2 Pre-commit hooks (Husky + lint-staged)

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:coverage"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests --passWithNoTests"
    ],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

**Установка:**

```bash
# Frontend
cd frontend
npx husky-init && npm install
npm install --save-dev lint-staged

# Backend
cd backend
npx husky-init && npm install
npm install --save-dev lint-staged
```

### 5.3 Test-Driven Development (TDD)

#### **Требования к покрытию:**

- ✅ **Минимум 80% покрытие кода тестами**
- ✅ **Обязательное тестирование критичных путей:**
  - Аутентификация и авторизация
  - Создание и обработка заказов
  - Синхронизация с ERP
  - Парсинг сроков годности
  - Проверка прав доступа

#### **Структура тестов:**

```typescript
// backend/tests/unit/services/product.service.test.ts
import { ProductService } from '../../../src/services/product.service';
import { ERPProviderFactory } from '../../../src/integrations/erp/ERPProviderFactory';
import { prisma } from '../../../src/config/database';

jest.mock('../../../src/integrations/erp/ERPProviderFactory');
jest.mock('../../../src/config/database');

describe('ProductService', () => {
  let productService: ProductService;
  let mockERPProvider: jest.Mocked<IERPProvider>;

  beforeEach(() => {
    mockERPProvider = {
      getProducts: jest.fn(),
      syncProducts: jest.fn(),
      // ... другие методы
    } as any;

    (ERPProviderFactory.createFromEnv as jest.Mock).mockReturnValue(mockERPProvider);
    productService = new ProductService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncProducts', () => {
    it('should sync products from ERP and save to database', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 'erp-123',
          name: 'Молоко 3.2% 31.12.2024',
          description: 'Свежее молоко',
        },
      ];
      mockERPProvider.getProducts.mockResolvedValue(mockProducts);

      // Act
      await productService.syncProducts();

      // Assert
      expect(mockERPProvider.getProducts).toHaveBeenCalledWith({ limit: 1000 });
      expect(prisma.product.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { erpId: 'erp-123' },
          update: expect.objectContaining({
            cleanName: 'Молоко 3.2%',
            hasExpiry: true,
          }),
        }),
      );
    });

    it('should handle ERP connection errors gracefully', async () => {
      // Arrange
      mockERPProvider.getProducts.mockRejectedValue(new Error('Connection timeout'));

      // Act & Assert
      await expect(productService.syncProducts()).rejects.toThrow('Connection timeout');
    });
  });
});
```

#### **Jest конфигурация**

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/server.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

#### **Типы тестов:**

**1. Unit тесты (изолированные)**

```typescript
// Тестируем отдельные функции/классы
describe('expiryParser', () => {
  it('should extract expiry date from product name', () => {
    const result = parseProductWithExpiry('Молоко 31.12.2024');
    expect(result.cleanName).toBe('Молоко');
    expect(result.expiryDate).toEqual(new Date('2024-12-31'));
    expect(result.hasExpiry).toBe(true);
  });
});
```

**2. Integration тесты (с БД)**

```typescript
// Тестируем взаимодействие с БД
describe('OrderRepository', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create order with items', async () => {
    const order = await orderRepository.create({
      userId: 'user-123',
      items: [{ productId: 'prod-1', quantity: 2, price: 100 }],
    });

    expect(order.id).toBeDefined();
    expect(order.items).toHaveLength(1);
  });
});
```

**3. API тесты (E2E для API)**

```typescript
// Тестируем HTTP endpoints
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/orders', () => {
  it('should create order and send email to operator', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        items: [{ product_id: 'prod-1', quantity: 2 }],
        comment: 'Urgent order',
      });

    expect(response.status).toBe(201);
    expect(response.body.order.order_number).toMatch(/ORD-\d+/);
    expect(emailService.sendOrderNotification).toHaveBeenCalled();
  });
});
```

**4. E2E тесты (Playwright)**

```typescript
// Тестируем UI workflow
import { test, expect } from '@playwright/test';

test('client can create order', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'client@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Add to cart
  await page.goto('/products');
  await page.click('[data-testid="product-card"]:first-child button');
  await page.click('[data-testid="cart-icon"]');

  // Checkout
  await page.click('text=Оформить заказ');
  await page.fill('[name="comment"]', 'Test order');
  await page.click('button:has-text("Подтвердить заказ")');

  // Verify
  await expect(page.locator('text=Заказ успешно создан')).toBeVisible();
});
```

### 5.4 CI/CD Pipeline

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm run lint

      - name: Run type check
        run: pnpm run type-check

      - name: Run Prisma migrations
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run tests with coverage
        run: pnpm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
```

---

## 6. План работ

### 6.1 Фаза 0: Подготовка (1 неделя)

**Цель:** Настроить инфраструктуру и инструменты разработки

**Задачи:**

1. **Настройка репозитория**
   - [ ] Создать Git репозиторий (GitHub)
   - [ ] Настроить структуру монорепо (frontend + backend)
   - [ ] Настроить .gitignore для Node.js + TypeScript
   - [ ] Создать README.md с инструкциями по запуску

2. **Настройка DevOps**
   - [ ] Создать docker-compose.yml (PostgreSQL + Redis + App)
   - [ ] Настроить GitHub Actions (CI/CD)
   - [ ] Создать Vercel проект для frontend
   - [ ] Создать Railway проект для backend
   - [ ] Настроить переменные окружения

3. **Настройка качества кода**
   - [ ] Установить ESLint + Prettier (frontend + backend)
   - [ ] Настроить Husky + lint-staged
   - [ ] Настроить TypeScript strict mode
   - [ ] Создать editorconfig

4. **Настройка тестирования**
   - [ ] Установить Jest + Testing Library (frontend)
   - [ ] Установить Jest + Supertest (backend)
   - [ ] Настроить Playwright для E2E
   - [ ] Создать test setup файлы
   - [ ] Настроить coverage reporting

5. **Инициализация проектов**
   - [ ] Frontend: `pnpm create vite@latest frontend --template react-ts`
   - [ ] Backend: Настроить Express + TypeScript
   - [ ] Установить зависимости
   - [ ] Создать базовую структуру папок

**Критерии готовности:**

- ✅ Проекты запускаются локально
- ✅ Docker Compose поднимает все сервисы
- ✅ Pre-commit hooks работают
- ✅ CI/CD пайплайны проходят

**Время:** 5 рабочих дней

---

### 6.2 Этап 1: MVP - Просмотр остатков (4-6 недель)

#### **Sprint 1: База данных и ERP интеграция (1.5 недели)**

**TDD подход:**

1. Написать тесты для ERP провайдера
2. Реализовать интерфейс IERPProvider
3. Реализовать MoySkladProvider
4. Написать тесты для парсера сроков годности
5. Реализовать парсер

**Задачи:**

1. **База данных**
   - [ ] Создать Prisma schema (users, products, stock)
   - [ ] Написать миграции
   - [ ] Создать seed данные для разработки
   - [ ] Написать тесты для repositories
   - [ ] Реализовать repositories

2. **ERP Integration**
   - [ ] Написать тесты для IERPProvider интерфейса
   - [ ] Создать IERPProvider интерфейс
   - [ ] Написать тесты для MoySkladProvider
   - [ ] Реализовать MoySkladProvider
   - [ ] Написать тесты для ERPProviderFactory
   - [ ] Реализовать ERPProviderFactory
   - [ ] Настроить подключение к МойСклад API

3. **Парсинг сроков годности**
   - [ ] Написать тесты для различных форматов дат
   - [ ] Реализовать функцию parseProductWithExpiry()
   - [ ] Тесты для граничных случаев (несколько дат, невалидные даты)
   - [ ] Обработка ошибок

4. **Синхронизация**
   - [ ] Написать тесты для ProductService.syncProducts()
   - [ ] Реализовать синхронизацию товаров
   - [ ] Написать тесты для синхронизации остатков
   - [ ] Реализовать синхронизацию остатков
   - [ ] Настроить Bull Queue
   - [ ] Настроить cron job (каждые 15 минут)

**Покрытие тестами:** 85%+ для критичных компонентов

**Критерии готовности:**

- ✅ БД создана с правильной схемой
- ✅ Товары синхронизируются из МойСклад
- ✅ Сроки годности корректно парсятся
- ✅ Все тесты проходят с покрытием 80%+

---

#### **Sprint 2: Аутентификация и авторизация (1 неделя)**

**TDD подход:**

1. Тесты для регистрации пользователя
2. Реализация регистрации
3. Тесты для логина
4. Реализация логина
5. Тесты для middleware проверки прав
6. Реализация middleware

**Задачи:**

1. **Backend - Auth Service**
   - [ ] Написать тесты для регистрации
   - [ ] Реализовать POST /api/auth/register
   - [ ] Написать тесты для логина
   - [ ] Реализовать POST /api/auth/login (JWT)
   - [ ] Написать тесты для refresh токена
   - [ ] Реализовать POST /api/auth/refresh
   - [ ] Тесты для logout
   - [ ] Реализовать POST /api/auth/logout

2. **Middleware**
   - [ ] Написать тесты для auth middleware
   - [ ] Реализовать authenticate middleware
   - [ ] Написать тесты для permissions middleware
   - [ ] Реализовать requireRole/requirePermission middleware
   - [ ] Тесты для rate limiting
   - [ ] Реализовать rate limiting

3. **Frontend - Auth**
   - [ ] Создать LoginPage с тестами
   - [ ] Создать RegisterPage с тестами
   - [ ] Реализовать useAuth hook
   - [ ] Настроить защищенные роуты
   - [ ] Реализовать authStore (Zustand)
   - [ ] Автоматический refresh токена

**Покрытие тестами:** 90%+ (критичная функциональность)

**Критерии готовности:**

- ✅ Пользователь может зарегистрироваться
- ✅ Пользователь может войти и получить JWT
- ✅ Защищенные роуты работают
- ✅ Права доступа проверяются корректно
- ✅ Все auth тесты проходят

---

#### **Sprint 3: Каталог товаров (1.5 недели)**

**TDD подход:**

1. Тесты для API получения товаров
2. Реализация API
3. Тесты для фильтрации
4. Реализация фильтрации
5. UI тесты
6. Реализация UI

**Задачи:**

1. **Backend API**
   - [ ] Тесты для GET /api/products (с фильтрами)
   - [ ] Реализовать GET /api/products
   - [ ] Тесты для фильтрации по категориям
   - [ ] Реализовать фильтрацию
   - [ ] Тесты для поиска
   - [ ] Реализовать поиск
   - [ ] Тесты для пагинации
   - [ ] Реализовать пагинацию
   - [ ] Тесты для разных прав доступа (клиент vs менеджер)
   - [ ] Реализовать условное отображение СГ

2. **Frontend - Components**
   - [ ] Тесты для ProductCard
   - [ ] Реализовать ProductCard (с/без СГ)
   - [ ] Тесты для ExpiryBadge
   - [ ] Реализовать ExpiryBadge (цветовая индикация)
   - [ ] Тесты для ProductList
   - [ ] Реализовать ProductList с пагинацией
   - [ ] Тесты для CategoryFilter
   - [ ] Реализовать фильтры по категориям
   - [ ] Тесты для SearchBar
   - [ ] Реализовать поиск

3. **Frontend - Pages**
   - [ ] Тесты для ProductsPage
   - [ ] Реализовать ProductsPage
   - [ ] Настроить TanStack Query для кэширования
   - [ ] Реализовать infinite scroll или пагинацию

4. **E2E тесты**
   - [ ] Тест: клиент видит товары без СГ
   - [ ] Тест: менеджер видит товары с СГ и индикацией
   - [ ] Тест: поиск работает корректно
   - [ ] Тест: фильтры применяются

**Покрытие тестами:** 80%+

**Критерии готовности:**

- ✅ Каталог загружается и отображается
- ✅ Клиенты видят товары БЕЗ сроков годности
- ✅ Менеджеры видят товары СО сроками годности
- ✅ Фильтры и поиск работают
- ✅ Все тесты проходят

---

#### **Sprint 4: Полировка и багфиксинг (1 неделя)**

**Задачи:**

1. **Тестирование**
   - [ ] Прогнать все E2E тесты
   - [ ] Проверить покрытие (должно быть 80%+)
   - [ ] Исправить критические баги
   - [ ] Code review

2. **Оптимизация**
   - [ ] Оптимизация SQL запросов
   - [ ] Настройка индексов БД
   - [ ] Настройка Redis кэширования
   - [ ] Проверка производительности

3. **Документация**
   - [ ] API документация (Swagger)
   - [ ] README для разработчиков
   - [ ] Инструкция по развертыванию

4. **Деплой**
   - [ ] Деплой frontend на Vercel
   - [ ] Деплой backend на Railway
   - [ ] Настройка production БД
   - [ ] Настройка мониторинга (Sentry)

**Критерии готовности:**

- ✅ Покрытие тестами 80%+
- ✅ Все критические баги исправлены
- ✅ Приложение задеплоено
- ✅ Мониторинг настроен

---

### 6.3 Этап 2: Оформление заказов (3-4 недели)

#### **Sprint 5: Корзина и создание заказов (2 недели)**

**TDD подход для каждой фичи**

**Задачи:**

1. **Backend - Orders**
   - [ ] Обновить Prisma schema (orders, order_items)
   - [ ] Написать миграции
   - [ ] Тесты для создания заказа
   - [ ] Реализовать POST /api/orders
   - [ ] Тесты для генерации номера заказа
   - [ ] Реализовать генератор номеров
   - [ ] Тесты для отправки email
   - [ ] Реализовать email уведомления
   - [ ] Тесты для валидации заказа
   - [ ] Реализовать валидацию

2. **Frontend - Cart**
   - [ ] Тесты для cartStore (Zustand)
   - [ ] Реализовать cartStore
   - [ ] Тесты для Cart компонента
   - [ ] Реализовать Cart UI
   - [ ] Тесты для добавления/удаления товаров
   - [ ] Реализовать функционал корзины

3. **Frontend - Checkout**
   - [ ] Тесты для CartPage
   - [ ] Реализовать CartPage
   - [ ] Тесты для формы заказа
   - [ ] Реализовать форму оформления
   - [ ] Тесты для подтверждения заказа
   - [ ] Реализовать подтверждение

4. **E2E тесты**
   - [ ] Тест: добавление в корзину
   - [ ] Тест: оформление заказа
   - [ ] Тест: получение email оператором

**Покрытие:** 80%+

---

#### **Sprint 6: История заказов (1-1.5 недели)**

**Задачи:**

1. **Backend**
   - [ ] Тесты для GET /api/orders (с учетом ролей)
   - [ ] Реализовать GET /api/orders
   - [ ] Тесты для GET /api/orders/:id
   - [ ] Реализовать GET /api/orders/:id
   - [ ] Тесты для повтора заказа
   - [ ] Реализовать POST /api/orders/:id/repeat

2. **Frontend**
   - [ ] Тесты для OrdersPage (клиент)
   - [ ] Реализовать OrdersPage для клиента
   - [ ] Тесты для OrdersPage (менеджер)
   - [ ] Реализовать OrdersPage для менеджера (READ ONLY)
   - [ ] Тесты для OrderDetailPage
   - [ ] Реализовать OrderDetailPage
   - [ ] Тесты для кнопки "Повторить заказ"
   - [ ] Реализовать повтор заказа

3. **E2E тесты**
   - [ ] Тест: клиент видит свои заказы
   - [ ] Тест: менеджер видит заказы своих клиентов
   - [ ] Тест: повтор заказа работает

**Покрытие:** 80%+

---

#### **Sprint 7: Полировка этапа 2 (0.5-1 неделя)**

**Задачи:**

- [ ] Багфиксинг
- [ ] Проверка покрытия
- [ ] Code review
- [ ] Деплой

---

### 6.4 Этап 3: Детализация товаров (2-3 недели)

**Sprint 8**

**Задачи:**

1. **Backend**
   - [ ] Добавить поля в schema (description, characteristics, imageUrl)
   - [ ] Тесты для загрузки изображений
   - [ ] Реализовать POST /api/products/:id/image
   - [ ] Настроить CloudFlare R2
   - [ ] Тесты для GET /api/products/:id
   - [ ] Реализовать детальную информацию о товаре

2. **Frontend**
   - [ ] Тесты для ProductDetailModal
   - [ ] Реализовать модальное окно
   - [ ] Тесты для отображения характеристик
   - [ ] Реализовать отображение характеристик
   - [ ] Тесты для загрузки изображений
   - [ ] Реализовать загрузку изображений (admin)

3. **E2E тесты**
   - [ ] Тест: открытие модального окна
   - [ ] Тест: отображение всех данных

**Покрытие:** 80%+

---

### 6.5 Этап 4: Уведомления об остатках (1-2 недели)

**Sprint 9**

**Задачи:**

1. **Backend**
   - [ ] Обновить schema (stock_alerts, stock_alert_history)
   - [ ] Тесты для CRUD stock alerts
   - [ ] Реализовать API для stock alerts
   - [ ] Тесты для проверки алертов (background job)
   - [ ] Реализовать проверку алертов
   - [ ] Тесты для отправки уведомлений
   - [ ] Реализовать email уведомления

2. **Frontend**
   - [ ] Тесты для StockAlertsPage
   - [ ] Реализовать StockAlertsPage
   - [ ] Тесты для создания алерта
   - [ ] Реализовать создание/редактирование
   - [ ] Тесты для управления алертами
   - [ ] Реализовать управление

3. **E2E тесты**
   - [ ] Тест: создание алерта
   - [ ] Тест: получение уведомления

**Покрытие:** 80%+

---

### 6.6 Этап 5: Тестирование с пользователями (2-3 недели)

**Задачи:**

1. **Alpha тестирование (1 неделя)**
   - [ ] Подготовить тестовый стенд
   - [ ] Пригласить 2-3 операторов
   - [ ] Собрать обратную связь
   - [ ] Создать список багов/улучшений
   - [ ] Исправить критические баги

2. **Beta тестирование (1-2 недели)**
   - [ ] Пригласить 10-20 клиентов
   - [ ] Мониторинг использования (Sentry, LogTail)
   - [ ] Собрать обратную связь
   - [ ] Исправить баги
   - [ ] UX улучшения

3. **Анализ**
   - [ ] Проанализировать метрики
   - [ ] Принять решение о переходе к этапу 6

---

### 6.7 Этап 6: Автоматизация заказов в ERP (3-4 недели)

**Sprint 10-11**

**Задачи:**

1. **Backend - ERP Integration**
   - [ ] Тесты для создания заказов в ERP
   - [ ] Реализовать создание заказов в МойСклад
   - [ ] Тесты для синхронизации статусов
   - [ ] Реализовать синхронизацию статусов
   - [ ] Тесты для обработки ошибок ERP
   - [ ] Реализовать retry логику

2. **Backend - Webhooks (опционально)**
   - [ ] Настроить webhooks от МойСклад
   - [ ] Обработка событий изменения заказов

3. **Frontend**
   - [ ] Отображение статусов заказов
   - [ ] Уведомления об изменении статусов

4. **Тестирование**
   - [ ] E2E тесты с реальной ERP
   - [ ] Проверка всех сценариев

**Покрытие:** 85%+ (критичный функционал)

---

## 7. Метрики качества

### 7.1 Code Quality Metrics

**Обязательные требования:**

- ✅ **Test Coverage:** ≥ 80% (критичные модули ≥ 90%)
- ✅ **ESLint:** 0 errors, warnings допустимы
- ✅ **TypeScript:** strict mode, 0 any (кроме явно типизированных)
- ✅ **Prettier:** 100% форматирование

**CI/CD Requirements:**

- ✅ Все тесты проходят
- ✅ Линтеры не выдают ошибок
- ✅ Coverage threshold соблюден
- ✅ Build успешен

### 7.2 Performance Metrics

- ⏱️ **Загрузка каталога:** < 2 сек
- ⏱️ **Создание заказа:** < 1 сек
- ⏱️ **Синхронизация ERP:** < 5 мин для 1000 товаров
- ⏱️ **API Response Time:** p95 < 200ms

### 7.3 Monitoring

**Production мониторинг:**

- Sentry для ошибок (frontend + backend)
- LogTail для логов
- Railway metrics для производительности
- Uptime monitoring (UptimeRobot или встроенный)

---

## 8. Бюджет и ресурсы

### 8.1 Команда

**Минимальная команда:**

- 1 Full-stack разработчик (TypeScript, React, Node.js)
- 0.5 QA инженера (на этапе тестирования)

**Оптимальная команда:**

- 1 Frontend разработчик (React, TypeScript)
- 1 Backend разработчик (Node.js, PostgreSQL)
- 0.5 QA инженера
- 0.25 DevOps (настройка CI/CD, мониторинг)

### 8.2 Стоимость инфраструктуры

**Месячные затраты (MVP):**

- Vercel (Frontend): $0 (hobby plan)
- Railway (Backend + DB + Redis): $10-20
- SendGrid (Email): $0 (12k emails/мес)
- CloudFlare R2 (Storage): $1-5
- Sentry (Monitoring): $0 (developer plan)
- **Итого: $15-30/месяц**

**Месячные затраты (продакшен 100+ пользователей):**

- Vercel Pro: $20
- Railway Pro: $50
- SendGrid Essentials: $20
- CloudFlare R2: $10
- Sentry Team: $30
- **Итого: $130/месяц**

### 8.3 Временные затраты

**Общая оценка (1 Full-stack разработчик):**

- Этап 0 (Подготовка): 1 неделя
- Этап 1 (MVP): 4-6 недель
- Этап 2 (Заказы): 3-4 недели
- Этап 3 (Детализация): 2-3 недели
- Этап 4 (Уведомления): 1-2 недели
- Этап 5 (Тестирование): 2-3 недели
- Этап 6 (Автоматизация): 3-4 недели

**Итого: 16-23 недели (4-6 месяцев)**

**С командой из 2 разработчиков:**
**Итого: 10-15 недель (2.5-4 месяца)**

---

## 9. Риски и митигация

| Риск                                       | Вероятность | Влияние | Митигация                                                   |
| ------------------------------------------ | ----------- | ------- | ----------------------------------------------------------- |
| API МойСклад недоступен                    | Средняя     | Высокое | Кэширование данных, retry логика, fallback на ручной ввод   |
| Изменение API МойСклад                     | Низкая      | Высокое | Абстракция ERP через интерфейс, версионирование API         |
| Низкая производительность при росте данных | Средняя     | Среднее | Индексы БД, кэширование, пагинация, оптимизация запросов    |
| Недостаточное покрытие тестами             | Средняя     | Среднее | Обязательный CI/CD с проверкой coverage, pre-push hooks     |
| Проблемы с парсингом СГ                    | Высокая     | Низкое  | Обширное тестирование регулярных выражений, fallback логика |
| Сложность миграции на 1С                   | Низкая      | Среднее | Абстракция через IERPProvider, документация миграции        |

---

## 10. Критерии успеха проекта

### 10.1 Технические

- ✅ Покрытие тестами ≥ 80%
- ✅ 0 критических багов в production
- ✅ Uptime ≥ 99.5%
- ✅ API Response Time p95 < 200ms
- ✅ Успешная синхронизация с ERP 99%+ случаев

### 10.2 Бизнесовые

- ✅ Сокращение времени обработки запроса клиента с 2 часов до 5 минут
- ✅ 80%+ клиентов используют приложение для просмотра остатков
- ✅ 50%+ заказов оформляются через приложение
- ✅ Положительная обратная связь от 80%+ пользователей
- ✅ Снижение количества ошибок в заказах на 50%+

### 10.3 Качество кода

- ✅ Все PR проходят code review
- ✅ CI/CD пайплайн всегда зеленый
- ✅ Документация актуальна
- ✅ Нет технического долга (или он запланирован)

---

## 11. Следующие шаги

1. **Утвердить ТЗ** с заказчиком
2. **Настроить инфраструктуру** (Фаза 0)
3. **Начать разработку** с этапа 1 в TDD подходе
4. **Еженедельные демо** заказчику
5. **Непрерывная интеграция** и деплой

---

## 12. Контакты и ресурсы

**Документация:**

- Техническая документация: `/docs`
- API документация: Swagger UI на `/api/docs`
- Changelog: `/CHANGELOG.md`

**Репозитории:**

- GitHub: `https://github.com/company/erpstock`
- Staging: `https://staging.erpstock.com`
- Production: `https://app.erpstock.com`

**Мониторинг:**

- Sentry: `https://sentry.io/erpstock`
- Railway Dashboard: `https://railway.app/project/xxx`
- Vercel Dashboard: `https://vercel.com/company/erpstock`

---

## Приложения

### A. Пример .env файла

```bash
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/erpstock

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# ERP Configuration
ERP_TYPE=moysklad
MOYSKLAD_TOKEN=your-moysklad-api-token
MOYSKLAD_BASE_URL=https://api.moysklad.ru/api/remap/1.2
MOYSKLAD_SYNC_INTERVAL=15

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@company.com

# File Storage
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY=your-access-key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET=erpstock-images

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

---

**Документ подготовлен:** 2026-02-10  
**Версия:** 1.0  
**Статус:** Ready for Development

---

**Готовы начать разработку?** 🚀
