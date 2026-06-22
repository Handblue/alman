# Building an APK / AAB for WortKrieg

The project is Expo (managed) and uses native modules (MMKV/Nitro, Reanimated). Two paths:

## A. EAS cloud build (recommended — no local toolchain)
Produces an installable APK (preview profile) or a Play AAB (production profile).
```bash
npx eas login                                   # your Expo account
npx eas build --platform android --profile preview      # -> installable .apk
# or, for the Play Store:
npx eas build --platform android --profile production    # -> .aab (app-bundle)
```
`eas.json` is already configured: `preview` → `buildType: apk`, `production` → `app-bundle`.

## B. Local build (needs JDK 17 + Android SDK)
```bash
# 1. JDK 17
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17

# 2. Android SDK (command-line tools) at ~/Library/Android/sdk
export ANDROID_HOME="$HOME/Library/Android/sdk"
#   install: platform-tools, platforms;android-35, build-tools;35.0.0, ndk;27.1.12297006, cmake;3.22.1
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;27.1.12297006" "cmake;3.22.1"

# 3. Generate the native project (gitignored) and build
npx expo prebuild --platform android
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
cd android
./gradlew assembleDebug      # debug APK (no keystore) -> app/build/outputs/apk/debug/app-debug.apk
# or ./gradlew assembleRelease  (needs a signing keystore configured)
```

## ⚠️ Cleartext backend (important for a working test build)
The app calls `http://45.143.11.97/api` (HTTP). Android release builds block cleartext, so a
release APK will fail network calls. For a **test** build to reach the backend, either:
- Move the backend to **HTTPS** (correct fix), or
- Temporarily allow cleartext for testing by adding to `app.json` →
  `android.usesCleartextTraffic: true` (NOT recommended for production).

## Versioning
`app.json`: `version` (1.0.0), `android.versionCode` (1). EAS `production` auto-increments
`versionCode`. Bump `version` for each public release.
