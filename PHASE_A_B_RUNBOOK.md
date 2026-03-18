# Phase A-B Runbook

## Phase A - Security and RBAC

### Implemented
- JWT is now used for login and register token generation.
- Centralized auth guard added in `src/lib/auth.ts`.
- API routes now use `requireAuth(...)` instead of base64 token parsing.
- Booking update authorization is hardened:
  - `ADMIN` can manage all.
  - Booking owner can only cancel own booking.
  - Vendor can manage bookings related to their own tickets.
- Register endpoint now validates input and only allows `USER` or `VENDOR`.
- Forgot password debug token is only returned in development mode.

## Phase B - Supabase PostgreSQL Configuration

### Implemented
- Prisma datasource switched from SQLite to PostgreSQL:
  - `provider = "postgresql"`
  - `url = env("DATABASE_URL")`
  - `directUrl = env("DIRECT_URL")`
- `.env` and `.env.example` updated for Supabase connection strings.
- Docker compose app service now consumes `DATABASE_URL`/`DIRECT_URL` from env.
- Script added: `db:migrate:deploy`.

## Commands to Execute on Your Machine

1. Update `.env` with real Supabase credentials.
2. Generate Prisma client:
```bash
npx prisma generate
```
3. Push schema to Supabase production:
```bash
npx prisma db push
```
4. Seed initial data (optional):
```bash
npx prisma db seed
```
5. Build application:
```bash
npm run build
```

## Notes
- In this sandbox, lint/build could not be executed due local execution policy and path permission constraints.
- Please run validation (`npm run lint`, `npm run build`) directly in your local terminal.
