# RolePrep Web App

RolePrep is a React + Vite frontend for AI-assisted interview practice. It connects to the RolePrep backend for:

- live session creation
- audio answer analysis
- session progress tracking
- plan and credit status
- Razorpay payment-link checkout

The app is optimized for desktop and mobile, includes PWA install support, and adapts its layout automatically based on device profile.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- Axios
- Recharts
- Lucide React

## Core Features

- Interview workspace at `/`
- Dashboard at `/dashboard`
- Real backend session sync
- Audio recording and audio upload
- Transcript + analysis panels
- Stage-aware progress tracking
- Plan and credit display from backend
- Payment checkout trigger through backend payment-link API
- PWA manifest, service worker, and install prompt
- Device-aware UI for mobile, tablet, desktop, and standalone app mode

## Backend Contract

The frontend expects the backend to expose these routes:

- `POST /api/sessions`
- `GET /api/sessions?user_id=<id>`
- `POST /api/analyze-audio`
- `POST /api/payments/link`

### `POST /api/sessions`

Expected request body:

```json
{
  "user_id": "string",
  "role": "string",
  "jd_text": "string",
  "parser_data": {
    "source": "webapp"
  },
  "resume_path": "string or null",
  "jd_path": "string or null"
}
```

### `GET /api/sessions`

Expected response session shape:

```json
{
  "sessions": [
    {
      "user_id": "string",
      "session_id": "string",
      "role": "string",
      "jd_text": "string",
      "current_question": "string",
      "current_stage": "string",
      "question_count": 0,
      "history": [],
      "scores": [],
      "active_session": true,
      "active_session_plan": "free",
      "session_credits": 0,
      "subscription_expiry": 0,
      "selected_plan": "free",
      "session_started_at": null,
      "last_session_activity_at": null,
      "updated_at": null
    }
  ]
}
```

### `POST /api/analyze-audio`

Expected multipart form fields:

- `file`
- `role`
- `jd_text`
- `current_question`

### `POST /api/payments/link`

Expected request body:

```json
{
  "user_id": "string",
  "plan_type": "session_10"
}
```

Expected response:

```json
{
  "status": "pending",
  "payment_link": "https://..."
}
```

Supported `plan_type` values:

- `session_10`
- `session_29`
- `premium`

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment

Frontend uses:

- `VITE_API_BASE_URL`

If not set, the app defaults to:

```txt
/api
```

That works well when Vercel rewrites frontend `/api/*` requests to the backend.

## Vercel / Production

Typical `vercel.json` setup:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "http://YOUR_BACKEND_HOST:8000/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This is needed for:

- SPA route refreshes like `/dashboard`
- backend proxying from the frontend domain

## Mobile and PWA Behavior

The app now adapts automatically using a device-profile hook.

It detects:

- mobile
- tablet
- desktop
- touch-capable devices
- reduced-motion preference
- standalone/PWA mode

Mobile behavior includes:

- tighter spacing
- reduced display type sizes
- more compact cards
- compact dashboard summary
- compact interview flow ordering

PWA support includes:

- `manifest.webmanifest`
- `sw.js`
- service worker registration
- install prompt in supported browsers
- iOS install guidance when native install prompt is unavailable

## Important Notes

- The frontend sends resume metadata and notes inside session context, but full binary resume ingestion still depends on backend support.
- Payment UI assumes the backend returns a valid Razorpay payment link from `POST /api/payments/link`.
- Plan and credits shown in the UI come from `/api/sessions`, so after payment webhook completion the frontend may need a manual or automatic refresh to reflect the updated state.

## Main Frontend Files

- `src/App.tsx`
- `src/main.tsx`
- `src/pages/InterviewPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/components/InstallPrompt.tsx`
- `src/hooks/useDeviceProfile.ts`
- `src/services/api.ts`
- `src/store/index.ts`
- `public/manifest.webmanifest`
- `public/sw.js`

## Status

This repo is no longer a landing-page template. It is the active frontend web app for RolePrep.
