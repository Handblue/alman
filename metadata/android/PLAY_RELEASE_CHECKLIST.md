# WortKrieg — Google Play Release Checklist

Comprehensive, ordered checklist to take WortKrieg from this repo to a Play Store production
release. Items marked **🚫 BLOCKER** must be resolved before a public launch.

---

## 0. Blockers (fix before public release)

- [ ] **🚫 Backend must use HTTPS.** The app calls `http://45.143.11.97/api` (cleartext HTTP)
      in `services/authService.ts` and `services/notificationService.ts`. Android blocks
      cleartext by default and the Play Data Safety "encrypted in transit" claim would be
      false. Action: put the backend behind a domain with a valid TLS certificate and change
      `API_BASE` to `https://...`. Until then, sign-in, sync, notifications, and battles are
      insecure (and may fail on stricter devices).
- [x] **Debug logging** — verified: no `console.log` of tokens/passwords/email in
      `services/`, `store/`, `hooks/`. (Re-check if you add logging.)
- [ ] **`.env` is tracked** and holds only `EXPO_PUBLIC_FIREBASE_*` keys. These are public
      client keys (bundled into any app build), so not a secret leak — but if you add real
      secrets, move them out of `.env` / git. `*.jks` and `google-service-account.json` are
      already git-ignored. ✅
- [ ] Decide Firebase usage. README says Firebase was removed, but `firebase.ts`, `aiService.ts`,
      and `studyGroupService.ts` still reference Firestore (guarded; no-op when `EXPO_PUBLIC_FIREBASE_*`
      is unset). Either configure Firebase for prod or confirm those features degrade gracefully.

## 1. App configuration
- [ ] `app.json`: `version` (e.g. `1.0.0`) and `android.versionCode` (e.g. `1`) set. EAS
      `production` profile has `autoIncrement: true`, so versionCode auto-bumps per build.
- [ ] Package name `com.wortkrieg.app` matches the Play Console app.
- [ ] App icon (`assets/icon.png`, 1024×1024) and adaptive icons present. ✅ (in repo)
- [ ] Permissions reviewed: `RECORD_AUDIO`, `INTERNET`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`.
      Contacts/calendar are blocked. ✅
- [ ] `expo-notifications` and microphone usage strings present. ✅

## 2. Build the Android App Bundle (.aab)
```bash
npx eas login
npx eas build:configure           # sets/links projectId in app.json (extra.eas.projectId)
npx eas build --platform android --profile production   # produces a signed .aab
```
- [ ] `eas.json` → `build.production.android.buildType` is `app-bundle`. ✅
- [ ] Use **Play App Signing** (recommended): let EAS generate the upload key; Google holds
      the app signing key. Record the upload keystore safely (EAS stores it, or use
      `eas credentials`).

## 3. Play Console — create the app
- [ ] Create app: name "WortKrieg", default language Turkish (tr-TR), app/game = App, free.
- [ ] App category: **Education**.
- [ ] Set up Play App Signing.

## 4. Store listing (per locale: tr-TR, en-US, de-DE)
- [ ] App name: `metadata/android/<locale>/title.txt`
- [ ] Short description (≤80 chars): `metadata/android/<locale>/short_description.txt`
- [ ] Full description (≤4000 chars): `metadata/android/<locale>/full_description.txt`
- [ ] App icon: 512×512 PNG (derive from `assets/icon.png`).
- [ ] **Feature graphic: 1024×500 PNG** (required). Content brief in `screenshots/GUIDE.md`.
- [ ] Phone screenshots: 2–8, 1080×1920 (portrait). See `screenshots/GUIDE.md`.
- [ ] (Optional) 7" and 10" tablet screenshots — app is phone-only (`supportsTablet: false`),
      so tablet screenshots are optional.

## 5. App content (required declarations)
- [ ] **Privacy Policy URL** — host `metadata/PRIVACY_POLICY.md` (or _TR) at a public URL and
      paste it. (GitHub Pages / Notion / your site.)
- [ ] **Data safety** — answers in `metadata/android/DATA_SAFETY.md`. Re-check "encrypted in
      transit" after HTTPS fix.
- [ ] **Content rating (IARC)** — answers in `metadata/android/CONTENT_RATING.md`. In review
      notes, clarify "WortKampf/war" theme is a metaphorical quiz duel (no violence).
- [ ] **Target audience & content** — 13+; do not opt into "Designed for Families".
- [ ] **Ads** — declare "No ads".
- [ ] **Government apps / financial / health** — No.

## 6. Pricing & distribution
- [ ] Free app. If premium subscription ships, set up the subscription product in Play Console
      → Monetize → Subscriptions, and ensure billing is integrated (currently premium is a
      backend plan flag — confirm whether Play Billing is required at launch or premium is a
      later milestone). If no real purchase is offered at launch, declare "No IAP".
- [ ] Select countries/regions for distribution.

## 7. Testing before production
- [ ] Upload the `.aab` to **Internal testing**; add testers; install and smoke-test:
      login, study modes, SRS, a battle, notifications, offline mode, pronunciation mic prompt.
- [ ] Promote to **Closed/Open testing** if desired, then **Production**.

## 8. Submit
```bash
# Option A: manual upload of the .aab in Play Console
# Option B: automated submit (requires a Google service-account JSON):
npx eas submit --platform android --profile production
```
- [ ] `eas.json` → `submit.production.android.serviceAccountKeyPath` points to your
      `google-service-account.json` (Play Console → API access → service account, role
      "Release manager"). Keep this file out of git (already covered by `.gitignore`? verify).
- [ ] Submit for review; first review can take a few days.

## 9. Release notes
- [ ] Use `metadata/android/<locale>/release_notes.txt` as the "What's new" text.

---

### Quick reference — what's already done in this repo
- ✅ Localized listings (tr/en/de): title, short & full description, release notes.
- ✅ Privacy policy (EN + TR), Data Safety answers, Content Rating answers.
- ✅ `eas.json` production profile builds a signed `.aab`.
- ✅ Icons, splash, notification icon present.
- ⏳ You must provide: HTTPS backend, hosted privacy-policy URL, feature graphic, screenshots,
  Google service-account JSON (for automated submit), and the developer/contact details in the
  policy files.
