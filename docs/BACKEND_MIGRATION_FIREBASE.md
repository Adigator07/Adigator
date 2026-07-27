# Adigator Supabase Migration Playbook

This document implements the first migration layer for the new backend architecture:

- Firebase Authentication
- Firestore data storage
- Cloudinary asset storage
- Next.js API route backend
- OpenAI, Groq, Gemini AI services

## Implemented in this phase

### 1. Firebase foundation
- Client initializer: `app/lib/firebase/client.ts`
- Admin initializer: `app/lib/firebase/admin.ts`
- Request auth guard: `app/lib/firebase/auth.ts`

### 2. Firestore service layer
- Campaign service: `app/lib/firestore/campaigns.ts`
- User profile service: `app/lib/firestore/profiles.ts`

### 3. Cloudinary service layer
- Upload utility: `app/lib/cloudinary/server.ts`
- Upload API route: `POST /api/v2/uploads/cloudinary`

### 4. New v2 Firestore APIs
- `GET /api/v2/campaigns`
- `POST /api/v2/campaigns`
- `GET /api/v2/campaigns/[id]`
- `PATCH /api/v2/campaigns/[id]`
- `DELETE /api/v2/campaigns/[id]`

These are parallel v2 routes so legacy Supabase routes remain available while frontend migration is in progress.

## Required environment variables

### Firebase client
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase admin (server)
Choose one mode:
- Single JSON: `FIREBASE_SERVICE_ACCOUNT_JSON`
- Split fields: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### Cloudinary
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### AI providers
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`

## Recommended migration sequence

1. Switch auth flows (login/register/session guard) from Supabase to Firebase auth.
2. Move campaign CRUD frontend calls from `/api/campaigns` to `/api/v2/campaigns`.
3. Move asset upload flows to `/api/v2/uploads/cloudinary`.
4. Migrate analytics/report/communications APIs into Firestore services.
5. Remove Supabase client/server helpers and package dependencies after parity tests pass.

## Safety and rollout

- Keep dual-read/dual-write only where needed during transition.
- Add feature flags for route switching in high-traffic features.
- Validate data parity before deleting Supabase code paths.
