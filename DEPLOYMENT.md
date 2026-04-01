# Voices — Deployment Guide

> This guide covers deploying both the **web app** (`apps/web`) and the **WhatsApp Cloud Functions** (`functions`) to production.
> Two deployment paths are described: **Firebase Hosting + Cloud Build** (fully Google Cloud) and **Vercel + Firebase** (simpler DX, recommended for a personal project).

---

## Table of Contents

1. [Secrets vs. Environment Variables](#1-secrets-vs-environment-variables)
2. [One-Time GCP Setup](#2-one-time-gcp-setup)
3. [Option A — Firebase Hosting + Cloud Build](#3-option-a--firebase-hosting--cloud-build)
4. [Option B — Vercel (Web) + Firebase (Functions)](#4-option-b--vercel-web--firebase-functions-recommended)
5. [Domain / Subdomain Setup](#5-domain--subdomain-setup)
6. [Post-Deploy Checklist](#6-post-deploy-checklist)

---

## 1. Secrets vs. Environment Variables

### Move to GCP Secret Manager (sensitive — never commit these)

| Variable | Why it's sensitive |
|---|---|
| `TWILIO_AUTH_TOKEN` | Full API access to your Twilio account — can send messages, incur charges |
| `TWILIO_ACCOUNT_SID` | Paired with auth token; conventionally kept secret |
| `GOOGLE_MAPS_API_KEY` | Can incur Google billing charges if leaked |

### Safe to keep as plain environment variables (non-sensitive config)

| Variable | Why it's fine |
|---|---|
| `TWILIO_WHATSAPP_NUMBER` | Public-facing phone number, no auth capability |
| `STORAGE_BUCKET` | Public bucket name, access is controlled by Storage Rules |
| `VOICES_WEB_URL` | Public URL |

### Remove entirely for production

| Variable | Reason |
|---|---|
| `DEV_SKIP_TWILIO_SIGNATURE` | Must NOT exist in production — disables request validation |

**Your `functions/.env` in production should only contain:**
```
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
STORAGE_BUCKET=voices-9a030.firebasestorage.app
VOICES_WEB_URL=https://your-subdomain.yourdomain.com
```

---

## 2. One-Time GCP Setup

These steps apply regardless of which deployment path you choose.

### 2a. Store secrets in GCP Secret Manager

Run these commands once from your terminal (you'll be prompted to enter each value):

```bash
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```

Verify they were stored:
```bash
firebase functions:secrets:access TWILIO_AUTH_TOKEN
```

> The `functions/src/index.ts` already declares these in the `secrets: [...]` array on each function. Firebase automatically mounts them as environment variables at runtime — no code changes needed.

### 2b. Strip the production .env

Edit `functions/.env` to remove secrets and the dev bypass flag:
```
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
STORAGE_BUCKET=voices-9a030.firebasestorage.app
VOICES_WEB_URL=https://your-subdomain.yourdomain.com
```

### 2c. Add .env to .gitignore

Ensure `functions/.env` is in `.gitignore` so real credentials (used locally) are never committed:

```bash
echo "functions/.env" >> .gitignore
echo "functions/.env.local" >> .gitignore
```

### 2d. Firestore indexes

The session cleaner queries `whatsapp_sessions` by `lastActivityAt`. Add the index:

```bash
firebase deploy --only firestore:indexes
```

Or add it manually in [firestore.indexes.json](firestore.indexes.json):
```json
{
  "indexes": [],
  "fieldOverrides": [
    {
      "collectionGroup": "whatsapp_sessions",
      "fieldPath": "lastActivityAt",
      "indexes": [{ "order": "ASCENDING", "queryScope": "COLLECTION" }]
    }
  ]
}
```

---

## 3. Option A — Firebase Hosting + Cloud Build

**Best for:** staying fully in Google Cloud, wanting tight integration between hosting and functions.

**Cost:** Firebase Hosting free tier covers a personal project easily (10 GB storage, 10 GB/month egress). Cloud Build gives 120 free build-minutes/day.

### 3a. firebase.json — add hosting config

Add a `hosting` block to [firebase.json](firebase.json):

```json
{
  "functions": [...],
  "hosting": {
    "public": "apps/web/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "firestore": {...},
  "storage": {...}
}
```

### 3b. Manual deploy (one-off)

```bash
# Build everything
pnpm --filter @voices/core build
pnpm --filter @voices/web build
pnpm --filter @voices/functions build

# Deploy functions + hosting in one command
firebase deploy --only functions,hosting
```

### 3c. Cloud Build CI/CD (auto-deploy on push to main)

**1. Create `cloudbuild.yaml` at the repo root:**

```yaml
steps:
  # Install pnpm
  - name: node:20
    entrypoint: npm
    args: [install, -g, pnpm]

  # Install all workspace dependencies
  - name: node:20
    entrypoint: pnpm
    args: [install, --frozen-lockfile]

  # Build packages in dependency order
  - name: node:20
    entrypoint: pnpm
    args: [--filter, '@voices/core', build]

  - name: node:20
    entrypoint: pnpm
    args: [--filter, '@voices/web', build]
    env:
      - VITE_FIREBASE_API_KEY=$_VITE_FIREBASE_API_KEY
      - VITE_FIREBASE_PROJECT_ID=$_VITE_FIREBASE_PROJECT_ID
      - VITE_FIREBASE_APP_ID=$_VITE_FIREBASE_APP_ID

  - name: node:20
    entrypoint: pnpm
    args: [--filter, '@voices/functions', build]

  # Deploy to Firebase
  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: firebase
    args: [deploy, --only, functions,hosting, --project, voices-9a030]

options:
  logging: CLOUD_LOGGING_ONLY
```

**2. Connect your GitHub repo to Cloud Build:**
- Go to [console.cloud.google.com](https://console.cloud.google.com) → Cloud Build → Triggers
- Click **Connect Repository** → GitHub → authorize → select your repo
- Click **Create Trigger**:
  - Event: Push to branch → `^main$`
  - Configuration: `cloudbuild.yaml` (auto-detected)
  - Add substitution variables for any `VITE_*` env vars your web app needs

**3. Grant Cloud Build the Firebase deploy role:**
- IAM → find the Cloud Build service account (`<project-number>@cloudbuild.gserviceaccount.com`)
- Add roles: **Firebase Admin**, **Cloud Functions Developer**, **Secret Manager Secret Accessor**

---

## 4. Option B — Vercel (Web) + Firebase (Functions) ✦ Recommended

**Best for:** best web deployment DX, instant preview URLs on every PR, zero config for Vite.

**Cost:** Vercel Hobby tier is free. Functions still deploy to Firebase (same as Option A).

### 4a. Deploy the web app to Vercel

**1. Install Vercel CLI:**
```bash
npm install -g vercel
```

**2. Add `vercel.json` to `apps/web/`:**
```json
{
  "buildCommand": "cd ../.. && pnpm --filter @voices/core build && pnpm --filter @voices/web build",
  "outputDirectory": "dist",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "vite"
}
```

**3. Deploy:**
```bash
cd apps/web
vercel --prod
```

Vercel will ask you to link a project. On the dashboard, add your Firebase environment variables under **Settings → Environment Variables**:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_APP_ID
```

**4. Connect GitHub for automatic deploys:**
- Vercel Dashboard → Import Git Repository → select your repo
- Set root directory to `apps/web`
- Every push to `main` auto-deploys; every PR gets a preview URL

### 4b. Deploy functions (same for both options)

```bash
pnpm --filter @voices/functions build
firebase deploy --only functions
```

Or add this to a `Makefile` / `package.json` script:
```json
"deploy:functions": "pnpm --filter @voices/functions build && firebase deploy --only functions"
```

### Comparison

| | Firebase Hosting + Cloud Build | Vercel + Firebase |
|---|---|---|
| Web deploy DX | Good | Excellent (PR previews, instant rollbacks) |
| Functions | Firebase | Firebase (same) |
| CI/CD setup effort | Medium (cloudbuild.yaml + IAM) | Low (just connect GitHub) |
| Cost | Free tier sufficient | Free tier sufficient |
| Custom domain | Firebase Hosting (free SSL) | Vercel (free SSL) |
| Monorepo support | Manual (cloudbuild.yaml) | Native |

---

## 5. Domain / Subdomain Setup

For a personal project, a **subdomain** is the most cost-effective path — you can add one to a domain you already own, or buy a cheap new one.

### Domain cost

| Registrar | .dev domain | .app domain | Notes |
|---|---|---|---|
| [Porkbun](https://porkbun.com) | ~$10/yr | ~$15/yr | Cheapest renewal prices |
| [Namecheap](https://namecheap.com) | ~$12/yr | ~$16/yr | Good UX |
| [Google Domains → Squarespace](https://domains.squarespace.com) | ~$12/yr | ~$20/yr | Native GCP integration |

Recommended: `voices.yournamehere.dev` via Porkbun (~$10/year).

### If using Firebase Hosting

1. Go to Firebase Console → Hosting → **Add custom domain**
2. Enter `voices.yourdomain.com`
3. Firebase gives you two DNS records (TXT for verification + A record)
4. Add them at your registrar's DNS settings
5. SSL certificate is provisioned automatically (takes ~24 hours to propagate)

### If using Vercel

1. Go to Vercel Dashboard → your project → **Settings → Domains**
2. Enter `voices.yourdomain.com`
3. Vercel gives you a CNAME record (e.g. `cname.vercel-dns.com`)
4. Add it at your registrar's DNS settings
5. SSL is automatic

### Subdomain for the Functions webhook

The WhatsApp webhook URL is always a Firebase Cloud Functions URL regardless of which hosting path you choose:
```
https://us-central1-voices-9a030.cloudfunctions.net/whatsappWebhook
```

This URL doesn't need a custom domain — Twilio only needs to reach it, and it doesn't matter what it looks like.

---

## 6. Post-Deploy Checklist

After your first production deployment, go through these steps:

- [ ] **Update Twilio webhook URL** — Twilio Console → your WhatsApp number → "A MESSAGE COMES IN" → set to your Cloud Functions URL
- [ ] **Remove `DEV_SKIP_TWILIO_SIGNATURE`** — confirm it is not in `functions/.env` and not set in Cloud Build substitutions
- [ ] **Verify secrets are mounted** — send a test WhatsApp message; check Cloud Functions logs for any "Missing required environment variable" errors
- [ ] **Update `VOICES_WEB_URL`** — set it to your real domain in `functions/.env` so story links are correct
- [ ] **Test the full flow** — sign in, create a story, confirm location, publish, verify the link works
- [ ] **Set up Firestore Security Rules** — ensure `whatsapp_sessions` can only be read/written by Cloud Functions (server-side), not the client app
- [ ] **Restrict the Google Maps API key** — in GCP Console → Credentials → edit the key → add an "API restrictions" to only allow the Geocoding API (prevents misuse if somehow leaked)
- [ ] **Enable Firebase App Check** (optional but recommended) — protects Firestore from unauthorized client access

---

*Last updated: 2026-04-01*
