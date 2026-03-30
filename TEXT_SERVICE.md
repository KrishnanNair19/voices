# Voices — WhatsApp Story Ingestion Service

> **Phase 4** of the Voices web app. Users text a Twilio WhatsApp number to create and publish stories without opening the web app.

---

## Table of Contents

1. [How It Works](#1-how-it-works)
2. [File Structure](#2-file-structure)
3. [Environment Setup](#3-environment-setup)
4. [Local Testing](#4-local-testing)
5. [Deployment](#5-deployment)
6. [Conversation Flow Reference](#6-conversation-flow-reference)
7. [Firestore Schema](#7-firestore-schema)
8. [Architecture Decisions](#8-architecture-decisions)
9. [Known Limitations / Next Steps](#9-known-limitations--next-steps)

---

## 1. How It Works

```
User (WhatsApp)
    │  sends message to Twilio number
    ▼
Twilio Gateway
    │  HTTP POST (x-www-form-urlencoded) to webhook URL
    ▼
whatsappWebhook  (Firebase Cloud Function)
    ├── Validates X-Twilio-Signature
    ├── Routes message by command / session state
    ├── Downloads media from Twilio → Firebase Storage
    └── Reads / writes Firestore (whatsapp_sessions collection)
    │
    ▼  (every 30 min)
sessionCleaner  (Firebase Cloud Function — scheduled)
    ├── Sends reminder if session idle > 1 hour
    └── Deletes session if idle > 24 hours
```

### User-facing commands

| Message | Effect |
|---|---|
| Any text (no session) | Sends full instructions |
| `START STORY` | Creates a new session (abandons any in-progress one) |
| Text message (during session) | Appended to story text content |
| Voice note (during session) | Stored as audio URL |
| Image / video attachment | Uploaded to Firebase Storage |
| `FINISH` | Starts metadata prompts (title → location → tags → visibility) |
| `SKIP` (during metadata) | Skips that metadata field |
| `yes` / `no` (visibility prompt) | Sets public/private; publishes the story and sends a link |

### Logic gate — no mixed media

A story can contain **text OR audio**, not both. Images and video can accompany either.
Violating this returns an error message and leaves the session intact.

---

## 2. File Structure

```
functions/                          — Firebase Cloud Functions package (@voices/functions)
├── package.json                    — deps: firebase-functions v6, twilio v5, sharp, axios
├── tsconfig.json                   — CommonJS output to lib/
├── .env.example                    — template for required environment variables
└── src/
    ├── index.ts                    — exports the two Cloud Functions:
    │                                   whatsappWebhook (HTTP)
    │                                   sessionCleaner  (scheduled, every 30 min)
    ├── types.ts                    — WhatsAppSession, SessionState, TwilioInboundMessage
    ├── config.ts                   — typed env-var loader (throws at cold-start if missing)
    │
    ├── webhook/
    │   ├── whatsappWebhook.ts      — Express app; mounted as the Cloud Function
    │   ├── messageRouter.ts        — validates Twilio signature, dispatches to handlers
    │   ├── sessionManager.ts       — Firestore CRUD for whatsapp_sessions/{phoneNumber}
    │   └── twilioHelper.ts         — twimlReply(), sendOutboundMessage(), validateTwilioSignature()
    │
    ├── handlers/
    │   ├── handleStartStory.ts     — START STORY: looks up userId, creates session
    │   ├── handleFinish.ts         — FINISH: guards empty story, advances to awaiting_title
    │   ├── handleContent.ts        — plain text messages (enforces logic gate)
    │   ├── handleMedia.ts          — image / video / voice attachments
    │   └── handleMetadata.ts       — title → location → tags → visibility → publish
    │
    ├── media/
    │   ├── mediaProcessor.ts       — download from Twilio (with auth), upload to Storage
    │   └── imageCompressor.ts      — sharp: resize ≤1920px + JPEG 80% if image > 5 MB
    │
    ├── story/
    │   └── storyPublisher.ts       — writes Firestore story doc; increments user storyCount
    │
    └── scheduler/
        └── sessionCleaner.ts       — reminder (1 hr) + auto-delete (24 hr) logic
```

### Key files to read first

| Goal | File |
|---|---|
| Understand the full request lifecycle | `src/webhook/messageRouter.ts` |
| Change session state machine | `src/types.ts` + `src/handlers/handleMetadata.ts` |
| Change what gets stored on publish | `src/story/storyPublisher.ts` |
| Change reminder / expiry timing | `src/config.ts` (`limits` object) |
| Change media size limit | `src/config.ts` + `src/media/imageCompressor.ts` |

---

## 3. Environment Setup

### Prerequisites

- Node 20+
- Firebase CLI: `npm install -g firebase-tools`
- A [Twilio account](https://twilio.com) with a WhatsApp-enabled number (sandbox is fine for dev)
- Firebase project with Firestore + Storage enabled

### Environment variables

Copy `functions/.env.example` to `functions/.env` and fill in all values:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VOICES_WEB_URL=https://your-app.web.app
```

These are loaded by `src/config.ts` at cold-start. The function will throw if any are missing.

> **Production:** use Firebase Secret Manager instead of `.env` — set secrets with
> `firebase functions:secrets:set TWILIO_AUTH_TOKEN`

### Install dependencies

```bash
# From monorepo root
pnpm install

# Or just for functions
pnpm --filter @voices/functions install
```

---

## 4. Local Testing

There are two recommended approaches: the Firebase emulator (full fidelity) and direct `curl` testing (fastest).

### Option A — Firebase Functions Emulator

**1. Start the emulator**

```bash
# From repo root
firebase emulators:start --only functions,firestore,storage
```

The webhook will be available at:
```
http://127.0.0.1:5001/<project-id>/us-central1/whatsappWebhook
```

**2. Expose it to the internet with ngrok**

Twilio needs a public HTTPS URL to send webhooks to.

```bash
# Install ngrok if needed: https://ngrok.com/download
ngrok http 5001
```

Copy the `https://...ngrok-free.app` URL. Your full webhook URL becomes:
```
https://<ngrok-id>.ngrok-free.app/<project-id>/us-central1/whatsappWebhook
```

**3. Configure Twilio**

In the [Twilio Console](https://console.twilio.com) → Messaging → Senders → your WhatsApp number (or sandbox):

- **"A MESSAGE COMES IN"** → Webhook → `POST` → paste the ngrok URL above

**4. Text your Twilio number from WhatsApp**

Use the phone number connected to the sandbox/production number.

---

### Option B — curl (no Twilio account needed)

You can simulate Twilio POST bodies directly. The webhook will skip signature validation if you set `TWILIO_AUTH_TOKEN=skip` and comment out the validation guard in `messageRouter.ts` temporarily.

**Simulate "START STORY":**
```bash
curl -X POST http://127.0.0.1:5001/<project-id>/us-central1/whatsappWebhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp%3A%2B15551234567&To=whatsapp%3A%2B14155238886&Body=START+STORY&NumMedia=0&MessageSid=SM123"
```

**Simulate sending text content:**
```bash
curl -X POST http://127.0.0.1:5001/<project-id>/us-central1/whatsappWebhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp%3A%2B15551234567&To=whatsapp%3A%2B14155238886&Body=Today+I+climbed+a+mountain+in+Sapa.&NumMedia=0&MessageSid=SM124"
```

**Simulate "FINISH":**
```bash
curl -X POST http://127.0.0.1:5001/<project-id>/us-central1/whatsappWebhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp%3A%2B15551234567&To=whatsapp%3A%2B14155238886&Body=FINISH&NumMedia=0&MessageSid=SM125"
```

**Simulate sending an image:**
```bash
curl -X POST http://127.0.0.1:5001/<project-id>/us-central1/whatsappWebhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp%3A%2B15551234567&To=whatsapp%3A%2B14155238886&Body=&NumMedia=1&MediaUrl0=https%3A%2F%2Fexample.com%2Fphoto.jpg&MediaContentType0=image%2Fjpeg&MessageSid=SM126"
```

> **Note:** media downloads will fail in curl tests unless you point `MediaUrl0` at a real, publicly accessible image URL. For emulator testing with real Twilio, the `MediaUrl*` values come pre-authenticated.

---

### Disabling signature validation for local tests

In `src/webhook/messageRouter.ts`, the validation guard is:

```typescript
if (!validateTwilioSignature(signature, url, req.body)) {
  res.status(403).send('Forbidden')
  return
}
```

For local curl testing, you can temporarily bypass it:

```typescript
const isDev = process.env['NODE_ENV'] === 'development'
if (!isDev && !validateTwilioSignature(signature, url, req.body)) {
  res.status(403).send('Forbidden')
  return
}
```

**Never disable validation in production.**

---

### Testing the scheduler locally

The `sessionCleaner` scheduled function can be triggered manually via the emulator UI at:
```
http://127.0.0.1:4000 → Functions → sessionCleaner → Run Now
```

Or via the Firebase CLI:
```bash
firebase functions:shell
# Then in the shell:
sessionCleaner()
```

---

## 5. Deployment

**1. Build**
```bash
pnpm --filter @voices/functions build
# or from functions/ directory:
npm run build
```

**2. Set secrets (production)**
```bash
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_WHATSAPP_NUMBER
firebase functions:secrets:set FIREBASE_STORAGE_BUCKET
firebase functions:secrets:set VOICES_WEB_URL
```

**3. Deploy**
```bash
firebase deploy --only functions
```

**4. Get the webhook URL**

After deploy, the URL is printed in the output:
```
Function URL (whatsappWebhook): https://us-central1-<project-id>.cloudfunctions.net/whatsappWebhook
```

Paste this into the Twilio Console as described in Option A step 3.

---

## 6. Conversation Flow Reference

```
User                                  Voices (TwiML reply)
────                                  ─────────────────────
[any message, no session]         →   Full instructions + "Send START STORY"
START STORY                       →   Session created. Instructions for content types.
[sends text]                      →   "Got it! Keep going or send FINISH."
[sends another text]              →   "Added! Keep going or send FINISH."
[sends image]                     →   "🖼 Image received! Keep sending or FINISH."
[sends voice note]                →   Error if text exists — or "🎤 Voice message received!"
FINISH                            →   "What's the title? (or SKIP)"
[title or SKIP]                   →   "Where did this take place? (or SKIP)"
[location or SKIP]                →   "Add some tags, comma-separated (or SKIP)"
[tags or SKIP]                    →   "Should this story be public? (yes/no)"
yes / no                          →   "🎉 Your story is live! [link]"

[START STORY mid-session]         →   Previous session deleted, new one started
[FINISH with no content]          →   "Your story is empty — send content first."
[text when audio exists]          →   "⛔ Can't mix text and audio. FINISH or START STORY."
[audio when text exists]          →   "⛔ Can't mix text and audio. FINISH or START STORY."

[idle 1 hour]  (scheduler)        →   Reminder sent via outbound message
[idle 24 hours] (scheduler)       →   Session deleted, expiry notice sent
```

---

## 7. Firestore Schema

### `whatsapp_sessions/{phoneNumber}`

Active story-creation sessions. Keyed by E.164 phone number (e.g. `+15551234567`).
Documents are deleted on publish or after 24 hours of inactivity.

| Field | Type | Description |
|---|---|---|
| `phoneNumber` | `string` | E.164 number (same as document ID) |
| `state` | `string` | `collecting` \| `awaiting_title` \| `awaiting_location` \| `awaiting_tags` \| `awaiting_visibility` |
| `contentType` | `string \| null` | `text` \| `audio` \| `null` |
| `textContent` | `string` | Accumulated text (newline-delimited chunks) |
| `audioUrl` | `string \| null` | Firebase Storage URL for voice note |
| `mediaUrls` | `string[]` | Firebase Storage URLs for images |
| `videoUrl` | `string \| null` | Firebase Storage URL for video |
| `draftTitle` | `string \| null` | Collected after FINISH |
| `draftLocation` | `string \| null` | Free-text location name |
| `draftTags` | `string[]` | Parsed from comma-separated reply |
| `isPublic` | `boolean` | Defaults to `true` |
| `userId` | `string \| null` | Voices uid if phone is linked; `null` otherwise |
| `createdAt` | `Timestamp` | Session start time |
| `lastActivityAt` | `Timestamp` | Updated on every message |
| `reminderSentAt` | `Timestamp \| null` | Set when the 1-hour reminder is sent |

### `stories/{storyId}` additions

Stories created via WhatsApp include an extra field:

| Field | Type | Value |
|---|---|---|
| `source` | `string` | `"whatsapp"` |

All other fields match the standard `Story` type from `@voices/core`.

### `users/{uid}` — required addition

To link a WhatsApp number to a Voices account, add this field to the `UserProfile`:

| Field | Type | Description |
|---|---|---|
| `whatsappPhone` | `string \| null` | E.164 number, e.g. `"+15551234567"` |

The function queries `users` where `whatsappPhone == phoneNumber` on every `START STORY`.
If no match, the story is published with `authorId: "whatsapp_<digits>"`.

### Firebase Storage paths

```
whatsapp/{phoneDigits}/{kind}/{timestamp}_{random}.{ext}

Examples:
  whatsapp/15551234567/image/1743200000000_a3f9z1.jpg
  whatsapp/15551234567/audio/1743200000000_bx82kq.ogg
  whatsapp/15551234567/video/1743200000000_qp01nz.mp4
```

---

## 8. Architecture Decisions

**Why a Firestore session document instead of in-memory state?**
Cloud Functions are stateless — each invocation is a fresh process. Firestore is the only persistent store available between calls.

**Why E.164 phone number as the Firestore document ID?**
It's already unique per user, requires no secondary index for lookups, and makes the session trivial to find and delete.

**Why a transaction for `appendText`?**
Firestore's `FieldValue.arrayUnion` only works on arrays, not strings. A transaction gives a consistent read-then-write without race conditions if the user sends two messages quickly.

**Why `maybeCompressImage` instead of always compressing?**
Compression is CPU-intensive. Images already under 5 MB are passed through untouched, keeping cold-start time and egress costs low.

**Why lazy imports in `index.ts`?**
`import()` defers module evaluation until first invocation, reducing cold-start time for the function that isn't called (e.g. the scheduler).

---

## 9. Known Limitations / Next Steps

- **Location coordinates:** WhatsApp location-share messages (which include lat/lng) are not yet handled. Currently, location is stored as a free-text string and `{ lat: 0, lng: 0 }` is written to Firestore. A future handler could parse Twilio's `Latitude` / `Longitude` fields.

- **Account linking UI:** There is no web UI yet for users to add their `whatsappPhone` to their profile. This needs an input field on `EditProfilePage` and a write to `users/{uid}.whatsappPhone`.

- **Multiple audio clips:** Only one voice note per story is supported. Subsequent audio messages are rejected.

- **Story link domain:** `VOICES_WEB_URL` defaults to `https://voices.app`. Update this env var once the app is deployed to its real domain.

- **Twilio WhatsApp 24-hour window:** Twilio enforces a 24-hour messaging window for outbound WhatsApp messages — the scheduler's reminder/expiry notices can only be sent if the user messaged within the last 24 hours, or if you use a pre-approved Message Template. For production, register a template for the reminder and expiry messages in the Twilio Console.
