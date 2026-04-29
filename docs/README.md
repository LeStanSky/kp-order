# KPOrder -- Documentation

## Navigation

| Document                       | Description     |
| ------------------------------ | --------------- |
| [onboarding.md](onboarding.md) | User onboarding |

---

## Quick start (development)

### Prerequisites

- Docker (for PostgreSQL and Redis)
- Node.js 22+
- pnpm

### Run

```bash
# 1. Start DB and Redis (WSL or Linux)
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Copy and fill in .env
cp backend/.env.example backend/.env
# Set MOYSKLAD_TOKEN if real synchronization is required
# ERP_TYPE=mock -- for development without МойСклад

# 4. Apply migrations and seed initial data
pnpm --filter backend exec prisma migrate dev
pnpm --filter backend exec prisma db seed

# 5. Start backend
pnpm --filter backend dev   # http://localhost:3000

# 6. Start frontend (in a separate terminal)
pnpm --filter frontend dev  # http://localhost:5173
```

### Test users (after seed)

| Email                  | Password    | Role    |
| ---------------------- | ----------- | ------- |
| admin@erpstock.local   | password123 | ADMIN   |
| manager@erpstock.local | password123 | MANAGER |
| client1@erpstock.local | password123 | CLIENT  |
| client2@erpstock.local | password123 | CLIENT  |

### Tests

```bash
pnpm --filter backend test   # 361 tests
pnpm --filter frontend test  # 198 tests
```

---

## Development status

| Phase                           | Status      |
| ------------------------------- | ----------- |
| Infrastructure                  | Done        |
| Backend MVP (products, orders)  | Done        |
| Product details (photos, specs) | Done        |
| Stock alerts                    | Done        |
| User management                 | Done        |
| User testing                    | In progress |
| Order automation in МойСклад    | Planned     |
