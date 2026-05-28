# N'Me's SM

## Build APK (ฟรี):
1. สมัคร https://expo.dev
2. ติดตั้ง Node.js (LTS) จาก nodejs.org
3. รันใน Terminal:
   npm install -g eas-cli
   eas login
   npm install
   eas build --platform android --profile preview
4. รอ ~15 นาที → Download APK

## Deploy Backend → Render:
Root: backend | Build: npm install | Start: node server.js

## Google Login:
console.cloud.google.com → OAuth 2.0 Client ID (Android)
ใส่ใน LoginScreen.js บรรทัด androidClientId
