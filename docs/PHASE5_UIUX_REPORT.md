# Phase 5 — UI/UX & Human-Eye Review

Performed by building the Expo **web** export, serving it locally, and inspecting key screens
at a 375×812 mobile viewport. (Web is a review surface only; the Play Store target is Android.)

## What was verified (renders correctly, looks polished)
- **Onboarding / Welcome** — title, tagline, gradient "Başla" + outline "Zaten hesabım var".
- **Dashboard** (dark-immersive) — header with level/streak/XP, "Günün Kelimesi" card (live B2
  idiom `der Apfel der Zwietracht`), daily quest, goal, leaderboard, friends/challenges.
- **Category → unit list** — "Deyimler · 20 ünite", all 20 generated units, each "15 kelime".
- **Word list** — generated idioms with accurate Turkish (e.g. `einen Bären aufbinden` →
  "birine kazık atmak", `die Katze im Sack kaufen` → "görmeden mal almak").
- The full 2400-word curriculum is live and consistent (20 units/category, 15 words/unit).

## Bugs found and FIXED
1. **Theme contrast (high impact).** The app's design is a *hybrid* — light browse surfaces +
   dark-immersive screens (almaapp_ui_guide.md §6). A Phase-0 change had flipped the global
   theme default to dark to satisfy a test, which made the ~21 light-browse screens' headers
   (white text on light background) invisible. **Fix:** restored light as the global default,
   added a `ThemeProvider initialDark` prop, and wrapped the dark-immersive dashboard in it so
   it stays dark while browse screens stay light. Verified both render correctly.
2. **Web export `import.meta` (web-only).** The exported `dist/index.html` loads the JS bundle
   with `<script defer>`, but the bundle uses `import.meta`, which requires
   `<script type="module">` — so on web the bundle throws and nothing renders. This does **not**
   affect the native Android/iOS build. For local web preview, patch after export:
   ```bash
   node -e 'const fs=require("fs");let h=fs.readFileSync("dist/index.html","utf8");h=h.replace(/<script src="([^"]+)" defer>/,`<script type="module" src="$1">`);fs.writeFileSync("dist/index.html",h)'
   ```
   (If web becomes a real target, fix the Expo web HTML template / upgrade off the canary.)

## Accessibility / UX notes (acceptable for launch; improvable)
- Interactive elements: ~373 touchables, with `accessibilityLabel` on ~125 and
  `accessibilityRole` on ~112. Core flows (word sheet, controls) are labeled; coverage could be
  extended to all icon-only buttons.
- Single-language Turkish UI (no i18n framework). Fine for the TR target audience.
- Touch targets rely on card/button sizing (≥44px visually); few explicit `hitSlop`.

## Preview tooling added
- `tools/preview-server.mjs` — zero-dep SPA static server for `dist/`.
- `.claude/launch.json` — `wortkrieg-web` preview config.
