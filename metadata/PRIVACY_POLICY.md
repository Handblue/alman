# Privacy Policy — WortKrieg

**Effective date:** [FILL: e.g. 2026-07-01]
**Developer:** [FILL: developer / company legal name]
**Contact:** [FILL: support email, e.g. privacy@wortkrieg.app]

> ⚠️ Developer note (remove before publishing): Fill the bracketed fields. The "encrypted
> in transit" claim below assumes the backend is served over **HTTPS**. The app currently
> calls `http://45.143.11.97/api` (cleartext). Move the backend to HTTPS before publishing,
> or correct this section and the Play Data Safety form accordingly. See STORE_CHECKLIST.md.

WortKrieg ("the app", "we") is a German-language learning app. This policy explains what
data we collect, why, and your choices. We do **not** sell your personal data and we do
**not** use third-party advertising.

## 1. Data we collect

**Account information (if you create an account or sign in).**
- Email address, username, and display name.
- Authentication credentials (password) — transmitted to our backend to sign you in.
- Optional: if you choose "Sign in with Google", we receive your Google account email and
  basic profile information via OAuth. We do not receive your Google password.

**Learning activity.**
- Your progress, scores, XP, streaks, study history, achievements, and battle (WortKampf)
  results. Used to provide the core features, spaced-repetition scheduling, leaderboards,
  and to sync your progress across sessions/devices.

**Device & technical data.**
- A push-notification token (via Expo) so we can send study reminders and battle
  challenges. You can disable notifications in your device settings.
- Basic device information needed to operate real-time features.

**Microphone / audio (only during pronunciation practice).**
- When you use a pronunciation exercise and grant microphone permission, your speech is
  captured and processed by the device's speech-recognition service to evaluate your
  pronunciation. On Android this uses Google's speech recognition; audio may be processed
  on Google's servers. We do not store your audio recordings on our servers. If you never
  use pronunciation features, no audio is collected.

**Stored locally on your device.**
- Settings, cached vocabulary, and offline progress are stored locally (MMKV / AsyncStorage)
  so the app works offline.

We do **not** access your contacts, calendar, photos, or precise location. The app
explicitly blocks contacts and calendar permissions.

## 2. How we use data
- To provide and improve the learning experience (study modes, SRS, statistics).
- To enable social and competitive features (friends, study groups, leaderboards, battles).
- To send notifications you have opted into (reminders, challenges).
- To maintain account security and prevent abuse.

## 3. Sharing & third parties
We share data only with service providers that help us run the app:
- **Backend hosting** — stores your account and progress data.
- **Expo push service** — delivers notifications.
- **Google speech recognition** — processes pronunciation audio (only when you use it).
- **Google Sign-In** — only if you choose it.

We do not sell data and do not share it for advertising.

## 4. Data retention & deletion
We keep account and progress data while your account is active. You can request deletion of
your account and associated data by contacting [FILL: support email]. Locally stored data is
removed when you uninstall the app or clear its data.

## 5. Children
WortKrieg is intended for a general audience (rated suitable for ages 3+/Everyone). It is not
directed at children under 13 and we do not knowingly collect their personal data.

## 6. Security
We use industry-standard measures to protect your data. Account and progress data is
transmitted to our backend over [HTTPS — see developer note]. No method of transmission or
storage is 100% secure.

## 7. Your rights
Depending on your region (e.g., GDPR/KVKK), you may have rights to access, correct, delete,
or export your data, and to withdraw consent. Contact us at [FILL: support email].

## 8. Changes
We may update this policy. Material changes will be reflected by an updated effective date.

## 9. Contact
[FILL: developer name] — [FILL: support email]
