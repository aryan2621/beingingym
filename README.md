# BeingInGym

Gym and fitness platform: workout tutorials, workout history, goals calendar, progress charts and route tracking.

**Mobile records, web shows.** Workouts (timer/stopwatch sessions) and GPS routes are created only in the mobile app. The web app is a read-only dashboard for them; the one thing you can edit on the web is the Goals calendar.

| Folder   | Stack                                                                       |
| -------- | --------------------------------------------------------------------------- |
| `web/`   | Next.js 15, React 19, Tailwind + shadcn/ui, React Query, Auth0, deployed to Cloudflare Workers via OpenNext |
| `api/`   | Cloudflare Worker (Hono + TypeScript), verifies Auth0 tokens, stores data in Firebase Firestore |
| `mobile/`| Expo (SDK 57) Android app: Auth0 login, workout timer/stopwatch, GPS run tracking, history and goals |

```
Browser ──> Web (Next.js on Cloudflare) ──login/session──> Auth0 (Google + email/password)
   │  Authorization: Bearer <Auth0 access token>
   └──────> api (Cloudflare Worker) ──verify JWT──> Auth0 JWKS
                         └──Firestore REST (service account)──> Firebase
```

## API

All routes except `/health` and `/videos/*` need an Auth0 access token. Data is stored per user under `users/{auth0 sub}`.

| Route | Purpose |
| --- | --- |
| `GET/PUT /me` | Profile (synced from Auth0 after login) |
| `GET/POST /events`, `PUT/DELETE /events/:id` | Goals calendar (`?from&to` ISO range) |
| `GET/POST /sessions`, `DELETE /sessions/:id` | Practise sessions (exercise, duration in seconds) |
| `GET/POST /tracks` | GPS routes (posted by the mobile app) |
| `GET /progress?range=Daily\|Weekly\|Monthly&tzOffset=` | Aggregated minutes per period and per exercise |
| `GET /videos/:playlistId` | Public YouTube playlist proxy, edge-cached for 1h |

## One-time setup

### 1. Auth0

1. **Applications → Create → Regular Web Application.**
    - Allowed Callback URLs: `http://localhost:3000/auth/callback, https://<your-web-domain>/auth/callback`
    - Allowed Logout URLs: `http://localhost:3000, https://<your-web-domain>`
    - Allowed Web Origins: same as the logout URLs
2. **Applications → APIs → Create API.** Pick an identifier such as `https://api.beingingym`; this is `AUTH0_AUDIENCE`. Turn on **Allow Offline Access**.
3. **Authentication → Social → Google** and **Authentication → Database → Username-Password-Authentication**: enable both for the application.

### 2. Firebase

1. Create a project and enable **Firestore** in native mode.
2. **Project settings → Service accounts → Generate new private key.** Keep the JSON out of the repo; you only need `project_id`, `client_email` and `private_key` from it.

### 3. Cloudflare

`npx wrangler login` (once per machine).

### 4. Contact email

Set `NEXT_PUBLIC_CONTACT_EMAIL` in `web/.env.local` (and at build time for deploys). "Contact us" links then open a new Gmail message to that address in the visitor's own account; the links are hidden while it is empty.

### 5. Mobile app (Auth0 Native application)

1. **Applications → Create → Native**, name it `BeingInGym Mobile`.
    - Allowed Callback URLs and Allowed Logout URLs: `beingingym://callback`, plus the `exp://…/--/callback` URL shown at the bottom of the app's sign-in screen when testing in Expo Go.
    - **Connections** tab: enable Google and Username-Password-Authentication.
2. Copy `mobile/.env.example` to `mobile/.env` and fill in the Native app's client ID.

## Run locally

```bash
# API, http://localhost:8787
cd api
npm install
cp .dev.vars.example .dev.vars   # fill in Auth0, Firebase and YouTube values
npm run dev

# Web, http://localhost:3000
cd web
npm install
cp .env.example .env.local       # fill in Auth0 values; generate AUTH0_SECRET with: openssl rand -hex 32
npm run dev
```

`npm run preview` in `web/` runs the app in the real Workers runtime (it reads `web/.dev.vars`).

### Mobile

```bash
cd api && npm run dev:lan        # API reachable from your phone on the same Wi-Fi
cd mobile && npm install && npx expo start
```

Scan the QR code with **Expo Go** (Android). Expo Go can't record runs in the background, so keep the screen on while testing a run; the release APK records with the screen off.

### Sample data

Until the mobile app writes real data, seed your account (log in on the web once first so your profile exists):

```bash
cd api
npm run seed -- --email you@example.com          # ~3 months of sessions, 8 routes, 7 goals
npm run seed -- --email you@example.com --clear  # remove only the seeded documents
```

Options: `--days 90`, `--lat 28.6129 --lng 77.2295` (where the sample routes start), or `--sub <auth0 user id>` instead of `--email`.

## Deploy

```bash
# API
cd api
for s in AUTH0_DOMAIN AUTH0_AUDIENCE FIREBASE_PROJECT_ID FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY YOUTUBE_API_KEY; do npx wrangler secret put $s; done
# set WEB_ORIGIN in api/wrangler.jsonc to the deployed web URL (comma-separate several origins)
npm run deploy

# Web
cd web
for s in AUTH0_DOMAIN AUTH0_CLIENT_ID AUTH0_CLIENT_SECRET AUTH0_SECRET APP_BASE_URL AUTH0_AUDIENCE; do npx wrangler secret put $s; done
NEXT_PUBLIC_API_URL=https://beingingym-api.<account>.workers.dev NEXT_PUBLIC_CONTACT_EMAIL=<inbox> npm run deploy
```

### Android APK (GitHub Releases)

`.github/workflows/android-release.yml` builds a signed `BeingInGym.apk` and attaches it to a GitHub Release whenever a `v*` tag is pushed. The web `/download` page and its QR code always point at `releases/latest/download/BeingInGym.apk`.

One-time setup:

```bash
keytool -genkeypair -v -keystore beingingym-release.keystore -alias beingingym -keyalg RSA -keysize 2048 -validity 10000
base64 -i beingingym-release.keystore | pbcopy   # paste as the ANDROID_KEYSTORE_BASE64 secret
```

Then add the secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` and the variables `EXPO_PUBLIC_AUTH0_DOMAIN`, `EXPO_PUBLIC_AUTH0_CLIENT_ID`, `EXPO_PUBLIC_AUTH0_AUDIENCE`, `EXPO_PUBLIC_API_URL` (the deployed **https** API), `EXPO_PUBLIC_WEB_URL`. Keep the keystore safe: every future update must be signed with the same key.

Release: `git tag v1.0.0 && git push origin v1.0.0`.

## Secrets

Secrets live only in `.env.local`, `.dev.vars` and Wrangler secrets, and are ignored by git (`.gitignore`), Cursor (`.cursorignore`) and Claude Code (`permissions.deny` in `.claude/settings.json`). Only the `*.example` files are committed.
