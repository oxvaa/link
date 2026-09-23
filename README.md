# LINK 0.8.0 — Chat Themes & iMessage UI

GitHub → `index.html` → Generate Snack workflow.

## What's new
- Chat E2EE banner now reads only `End-to-end encrypted`.
- Removed per-message encryption lock icons.
- Redesigned chat header, message bubbles, metadata, typing state and composer toward a clean Apple/iMessage-style UI.
- Per-conversation Chat Themes with live previews and subscription gating.
- Free: Default, Red.
- LINK Plus: Green, Race Green, Lime Green, Bright Red, Yellow.
- LINK Pro: Cyan Green, Cyan Blue, Sunset gradient, Blue & Purple gradient, Gold, Monochromatic, Sky Blue (Classic), Rose Pink, Hot Pink, Glamurous Pink.
- Gradient themes use `expo-linear-gradient`.
- Existing LINK 0.7.x data migrates and keeps conversations/subscriptions.

## Snack dependency added
- `expo-linear-gradient@~57.0.2`

## Test path
1. Generate the Snack from `index.html`.
2. Open any linked conversation.
3. Tap the palette icon in the chat header.
4. Select a Free theme, or activate LINK Plus/Pro to unlock premium groups.
