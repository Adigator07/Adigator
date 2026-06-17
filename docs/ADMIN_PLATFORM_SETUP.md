# Adigator Enterprise Admin Platform

Production-ready admin dashboard integrated with the Adigator Next.js app and Supabase PostgreSQL.

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 App Router, TypeScript, TailwindCSS, Recharts |
| API | Next.js Route Handlers `/api/admin/v1/*` |
| Auth | Supabase Auth (JWT access tokens) + RBAC |
| Database | PostgreSQL (Supabase) + Prisma schema |
| Realtime | Express + Socket.io + Redis (`services/realtime-server`) |
| Cache | Redis (optional) |

## Folder structure

```
app/
  api/admin/v1/          REST API (dashboard, users, audit, analytics, health)
  dashboard/admin/       Admin UI pages
  components/admin/      Dashboard widgets, charts, presence
  components/ui/         ShadCN-style primitives
  lib/admin-platform/    Auth, RBAC, services, client SDK
prisma/schema.prisma     ORM models (mirrors Supabase tables)
supabase/migrations/     SQL migration for admin tables
services/realtime-server Express + Socket.io presence
docker/docker-compose.admin.yml
docs/ADMIN_PLATFORM_SETUP.md
```

## Setup

### 1. Apply database migration

Run in Supabase SQL Editor:

`supabase/migrations/20260615_admin_enterprise_platform.sql`

Or copy to `supabase/RUN_ADMIN_PLATFORM.sql` and execute.

### 2. Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Required for admin APIs

DATABASE_URL=                     # Postgres connection (Prisma)
REDIS_URL=redis://localhost:6379  # Optional
NEXT_PUBLIC_REALTIME_URL=http://localhost:4010

# Email alerts (Phase 11)
SMTP_HOST=
SMTP_USER=
ADMIN_EMAIL=admin@company.com
SECURITY_EMAIL=security@company.com
ALERTS_EMAIL=alerts@company.com
```

### 3. Grant admin access

```sql
UPDATE public.profiles
SET role = 'admin', admin_role = 'super_admin', status = 'active'
WHERE email = 'you@example.com';
```

### 4. Install dependencies

```bash
npm install recharts socket.io-client ioredis
cd services/realtime-server && npm install
```

### 5. Start services

```bash
# Next.js app
npm run dev

# Realtime (optional)
cd services/realtime-server && npm run dev

# Or Docker
docker compose -f docker/docker-compose.admin.yml up -d
```

## API endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/admin/v1/dashboard` | analytics:read |
| GET | `/api/admin/v1/analytics` | analytics:read |
| GET | `/api/admin/v1/users` | users:read |
| GET | `/api/admin/v1/users?format=csv` | users:read |
| GET | `/api/admin/v1/users/:id` | users:read |
| POST | `/api/admin/v1/users/:id/actions` | users:write |
| GET | `/api/admin/v1/audit` | audit:read |
| GET | `/api/admin/v1/permissions` | permissions:write |
| GET | `/api/admin/v1/health` | health:read |

Authorization: `Bearer <supabase_access_token>`

## Roles (RBAC)

- **super_admin** — full access (`*`)
- **admin** — users, reports, audit, permissions
- **moderator** — read users, suspend, audit
- **support** — read users, support tools
- **user** — standard app access

## Admin UI routes

- `/dashboard/admin` — Overview + charts
- `/dashboard/admin/users` — User management
- `/dashboard/admin/users/[id]` — Profile, timeline, permissions
- `/dashboard/admin/analytics` — DAU/WAU/MAU, retention
- `/dashboard/admin/audit` — Audit trail
- `/dashboard/admin/permissions` — Role definitions
- `/dashboard/admin/health` — System health
- `/dashboard/admin/activity` — Legacy activity feed
- `/dashboard/admin/notifications` — Notification center
- `/dashboard/admin/settings` — Configuration

## Phases roadmap

Phases 1–10 and 13–17 are implemented in this foundation. Remaining work for full enterprise rollout:

- **Phase 11** — Nodemailer/SendGrid alert templates + scheduled PDF reports
- **Phase 12** — Push notifications (FCM/Web Push)
- **Phase 15** — Excel/PDF export (CSV implemented; add `xlsx` + `jspdf`)
- **Phase 16** — CI/CD GitHub Actions, production monitoring (Datadog/Sentry)

## Security checklist

- JWT via Supabase (rotate keys in production)
- RBAC on every admin API route
- Service role key **server-only**
- RLS policies on admin tables
- Audit log on destructive actions
- Rate limiting: add `@upstash/ratelimit` on `/api/admin/*`
- 2FA: enable Supabase MFA for admin accounts

## Prisma

```bash
npx prisma generate
npx prisma db pull   # if syncing from Supabase
```

## Testing admin access

1. Log in as admin user
2. Visit `/dashboard/admin`
3. Verify dashboard metrics load
4. Test user suspend/activate in Users table
