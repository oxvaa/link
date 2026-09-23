# LINK 0.7.0 — Encrypted Chat, Silent Chat & LINK Pro

GitHub-ready Expo/Snack prototype. Keep `App.js` and `index.html` in the root of a public GitHub repository, enable GitHub Pages, then open the page and tap **Vytvořit nový Snack**.

## What changed

- **Encrypted chat prototype:** message text and attachment metadata are encrypted with AES-256-GCM via `expo-crypto` before conversation payloads are written to local storage. Each conversation receives a separate key.
- **Silent Chat:** turn disappearing messages on per conversation and choose 30 sec, 5 min, 1 hour or 24 hours. LINK Pro adds 10 sec and 7 day presets.
- **LINK Pro:** Monthly **149 Kč** or Annual **1,190 Kč**.
- **Annual trial toggle:** optional **7 days Free Trial** toggle directly on the Annual plan.
- **Pro perks:** everything in LINK Plus, Ghost Mode (no Seen receipt), 7-day Notes, Profile Insights, 30% LINK Shop discount, advanced Silent Chat timers, PRO badge and larger LINK Coin drops.
- Existing LINK Plus, local accounts, LINK requests, @username search, chats, Notes, Moments, profile photos, custom status, Profile Effects and Liquid Glass navigation remain intact.

## Security note

This is still a **single-device Local Accounts prototype**, not an audited production messaging protocol. Local accounts live in one app instance; production multi-device key exchange / identity verification is not implemented yet. Selected media files are still managed by the device/gallery. The app says this explicitly in the encryption information sheet rather than pretending the prototype is production-grade E2EE.

## Expo dependencies added

- `expo-crypto@~57.0.3`

The root `index.html` launcher includes this dependency automatically when it creates a Snack.
