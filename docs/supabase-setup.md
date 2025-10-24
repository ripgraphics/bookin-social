## Supabase Setup

This project uses Supabase for authentication and database.

### Required Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key  # server-only
SUPABASE_DB_URL=postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require  # server-only
```

Do not commit secrets. Keep server-only keys off the client.

### Auth Providers
- Email/password enabled
- Magic link (passwordless) enabled in Supabase Auth settings

### Notes
- SSL is required when connecting directly to Postgres.
- If DNS prefers IPv6 and fails locally, use IPv4-first resolution.


