# Google Play — Data Safety Form Answers (WortKrieg)

Fill these into Play Console → App content → Data safety. Answers reflect the app's actual
behaviour. **Verify the "encrypted in transit" answer** — it depends on the backend using
HTTPS (currently the app calls `http://45.143.11.97/api`, cleartext). See STORE_CHECKLIST.md.

## Overview
- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Currently NO**
  (backend is HTTP). → Move backend to HTTPS, then answer **Yes**. Do not claim Yes until then.
- Do you provide a way for users to request that their data is deleted? **Yes** (via support email).

## Data types collected / shared

| Data type | Collected | Shared | Optional? | Purpose |
|---|---|---|---|---|
| **Personal info → Name** (username / display name) | Yes | No | Optional (only if account created) | Account management, app functionality |
| **Personal info → Email address** | Yes | No | Optional (only if account / Google sign-in) | Account management, app functionality |
| **Personal info → User IDs** | Yes | No | Optional | Account management |
| **App activity → App interactions** (progress, XP, scores, streaks, battle results) | Yes | No | Optional (synced only with account) | App functionality, personalization, analytics |
| **Audio → Voice or sound recordings** (pronunciation practice) | Yes (processed) | Yes — to Google speech recognition | Optional (only when using pronunciation) | App functionality (pronunciation evaluation) |
| **Device or other IDs** (push notification token) | Yes | No | Optional (only if notifications enabled) | Send reminders / battle challenges |

Notes:
- **Audio** is captured only during a pronunciation exercise and only with mic permission.
  It is processed by the on-device/cloud speech-recognition service (Google on Android) to
  return a transcript. It is **not stored on our servers**. Declared as "shared" because the
  audio is processed by a third-party (Google) speech service.
- We do **not** collect: location, contacts, calendar, photos/media, financial info, health,
  messages, web browsing. Contacts and calendar permissions are explicitly blocked.
- We do **not** use the data for advertising or sell it.

## Security practices to declare
- Data is encrypted in transit: **answer after enabling HTTPS** (see above).
- Users can request deletion: **Yes** — provide the support email/URL.
- Committed to Play Families Policy: app is general audience; not designed for children.

## Account requirement
The app can be used for studying without an account (offline). Account/sign-in is optional
and only required for cloud sync, social features, and online battles.
