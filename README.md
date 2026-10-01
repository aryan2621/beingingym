# BeingInGym

Record workouts and runs on your phone, see your history, progress and goals on the web.

- **Web:** https://beingingym-web.just-a-dev.workers.dev
- **Android app:** [latest APK](https://github.com/aryan2621/beingingym/releases/latest/download/BeingInGym.apk)

| Folder | What | Stack |
| --- | --- | --- |
| `web/` | Dashboard (read-only, goals editable) | Next.js 15 on Cloudflare Workers (OpenNext), Auth0 |
| `api/` | REST API | Cloudflare Worker (Hono), Firestore, Auth0 JWT |
| `mobile/` | Android app: workout timer, GPS runs | Expo SDK 57, Auth0 |

## Setup

1. **Auth0:** a Regular Web app (web), a Native app (mobile, callback `beingingym://callback`) and an API with identifier `https://api.beingingym`. Enable Google and Username-Password.
2. **Firebase:** Firestore in production mode, plus a service account key.
3. **Env files** (not committed):

| File | Variables |
| --- | --- |
| `api/.dev.vars` | `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `YOUTUBE_API_KEY` |
| `web/.env` | `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET` (`openssl rand -hex 32`), `APP_BASE_URL`, `AUTH0_AUDIENCE`, `NEXT_PUBLIC_API_URL` |
| `mobile/.env` | `EXPO_PUBLIC_AUTH0_DOMAIN`, `EXPO_PUBLIC_AUTH0_CLIENT_ID`, `EXPO_PUBLIC_AUTH0_AUDIENCE`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEB_URL` |

## Run locally

```bash
cd api && npm i && npm run dev:lan    # :8787, reachable from your phone
cd web && npm i && npm run dev        # :3000
cd mobile && npm i && npx expo start  # scan with Expo Go
```

Sample data: `cd api && npm run seed -- --email you@example.com` (add `--clear` to remove it).

## Deploy

```bash
cd api && npx wrangler deploy
cd web && NEXT_PUBLIC_API_URL=https://beingingym-api.just-a-dev.workers.dev npm run deploy
```

Runtime secrets are set with `npx wrangler secret put <NAME>` (or `wrangler secret bulk`).

**Android APK:** push a `v*` tag (`git tag v1.0.1 && git push origin v1.0.1`). GitHub Actions builds a signed `BeingInGym.apk` and publishes it to Releases. This needs the repo secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` and the `EXPO_PUBLIC_*` repo variables.
