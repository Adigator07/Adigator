# Password Security Audit

## Storage model

| Location | What's stored | Algorithm |
|----------|---------------|-----------|
| `auth.users` (Supabase) | Canonical password hash | **bcrypt** (managed by Supabase Auth) |
| `public.profiles` | `password_hash_version` metadata only | No password material |
| `public.auth_password_legacy` | Temporary weak hashes pending migration | plaintext / md5 / sha1 / bcrypt |

**No plaintext, MD5, or SHA-1 passwords are written by the application on signup or password change.**

## Application services

- `app/lib/auth/passwordService.ts` — bcrypt (cost **12**), legacy verification, constant-time compares
- `app/lib/auth/authService.ts` — signup, login (with migration), password change
- `app/lib/auth/legacyPasswordMigration.ts` — re-hash weak legacy passwords on next login

## Migration

1. Run `supabase/migrations/20260625_auth_password_legacy.sql`
2. Import legacy hashes: `node scripts/import-legacy-passwords.mjs legacy-users.json`
3. Users authenticate normally — weak hashes upgrade to Supabase bcrypt automatically

## Logging policy

Auth code never logs passwords. Validation logs redact emails. Grep audit:

```bash
rg "console\.(log|warn|error).*password" app/
```

## Password change API

`POST /api/auth/change-password` (Bearer token required)

```json
{
  "email": "user@example.com",
  "currentPassword": "...",
  "newPassword": "..."
}
```
