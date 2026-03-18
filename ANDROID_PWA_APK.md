## Build APK from PWA (Trusted Web Activity)

This keeps one web codebase and ships an Android APK for debug/release.

### Prereqs
- Node 18+ (already)
- JDK 17
- Android SDK / platform-tools
- Chrome 72+ on device (for TWA)
- `bubblewrap` CLI: `npm i -g @bubblewrap/cli`

### Steps
1) Ensure PWA good: `npm run build` then run with `npm run start` and visit `https://<your-domain>` (must be HTTPS in prod; for debug you can use `http://10.0.2.2:3000` via emulator).
2) Init TWA project (one-time):
```bash
bubblewrap init --manifest=https://your-domain/manifest.json --directory twa
```
   - Package ID: e.g. `id.trevins.app`
   - Name: Trevins
   - Host: your-domain (must match start_url scope)
3) Build debug APK:
```bash
cd twa
bubblewrap build --debug
```
   Output: `app/build/outputs/apk/debug/app-debug.apk`
4) Install to device/emulator:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
5) Release signing:
```bash
keytool -genkey -v -keystore keystore.jks -alias trevins -keyalg RSA -keysize 2048 -validity 10000
bubblewrap build --release --keystore=keystore.jks --keyAlias=trevins
```
   Upload `app-release.apk` to Play Console (Internal testing first).

### Notes
- For local dev (HTTP) set `--skipPwaValidation` on `bubblewrap init/build` and point to `http://10.0.2.2:3000/manifest.json` while emulator hits your local dev server.
- Update `public/manifest.json` icons to include 192x192 and 512x512 PNG for Play compliance; scope/start_url must be HTTPS in production.
- TWA uses Chrome Custom Tabs; push notifications need service worker + FCM (future work).

### Alternative (Capacitor)
If you prefer hybrid wrapper instead of TWA:
```bash
npm i -D @capacitor/cli @capacitor/android
npx cap init trevins id.trevins.app
npx cap add android
npm run build && npx cap copy
```
Open `android/` in Android Studio and build debug/release. Use when you need native plugins.
