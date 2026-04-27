# 🗒️ Noted!

**A privacy-first, offline PWA bullet journal for capturing timestamped thoughts, tasks, events and ideas.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0--beta1-blue)](https://github.com/lucasfr/noted/releases/tag/v1.0.0-beta1)
[![Changelog](https://img.shields.io/badge/changelog-📝-lightgrey)](./CHANGELOG.md)
[![PWA](https://img.shields.io/badge/PWA-offline--ready-5A0FC8)](https://noted.lfranca.uk)
[![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)](./vite.config.js)
[![Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?logo=netlify&logoColor=white)](https://noted.lfranca.uk)

---

## 📖 What is Noted!

Noted! is a minimal bullet journal PWA that runs entirely in your browser. Every entry is timestamped automatically, stored only in your device's local storage, and never sent anywhere. No account. No server. No tracking. Your notes stay yours.

When you're ready to move entries into your permanent notes app, export them as structured JSON and import or paste them wherever you store your knowledge.

## ✨ Features

- 🔒 **Privacy-first** — all data stays on-device in localStorage; nothing is transmitted or synced
- 🔇 **Privacy mode** — blur all entry text with a tap; auto-reveals on hover, auto-hides after 15 seconds
- 📝 **Four entry types** — ♣ note, ♠ task, ♥ event, ♦ idea — each colour-coded with a left accent stripe
- 🕐 **Automatic timestamps** on every entry, grouped by day, with per-day delete
- **#hashtag detection** — tags extracted and rendered as inline pills
- 👆 **Swipe to edit or delete** — swipe left on any entry to reveal Edit and Delete actions
- 🌙 **Theme cycling** — Auto / Light / Dark, follows system preference
- 🎙️ **Voice input** — Web Speech API for hands-free capture
- ✅ **Task completion** — tap ○/✓ to mark tasks done with strikethrough; swipe right to complete
- 🔍 **Search** — filter entries by text or #tag (⌘F); shows a “No results” state when empty
- 📤 **JSON + Markdown export** — copy or download as JSON, or copy as Markdown
- 📥 **JSON import** — restore entries from a backup file; duplicates are skipped automatically
- 📱 **PWA** — installable on iOS, Android and desktop, works fully offline
- 🍔 **Mobile-optimised** — hamburger menu with bottom drawer; shortcuts accessible via drawer
- ⌨️ **Keyboard shortcuts** — press `?` on desktop for a full list
- 🎓 **Onboarding** — guided walkthrough on first launch including PWA install instructions

## 🗂️ Project Structure

```
noted/
├── index.html              # App shell with header, drawer, input, modals
├── src/
│   ├── app.js              # All application logic
│   ├── style.css           # Design system and styles
│   └── partials/           # HTML reference partials (header, input, modals)
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   └── icon-512.png
├── vite.config.js
├── netlify.toml
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18

### Running locally

```bash
git clone https://github.com/lucasfr/noted.git
cd noted
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Building for production

```bash
npm run build   # outputs to dist/
```

### Installing as a PWA

On **iOS**: open the live URL in Safari → Share → Add to Home Screen  
On **Android**: open in Chrome → browser menu → Add to Home Screen

### Exporting your entries

1. Tap the **download** icon (desktop) or open the **menu** (mobile)
2. Choose **Copy** or **Download** to get the JSON
3. Import into your permanent notes app, spreadsheet, or any tool you use

## 🎨 Design System

All design tokens are CSS variables in `src/style.css`.

| Variable | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#E8EDF2` | `#1A2330` | Page background |
| `--text` | `#2C3947` | `#D8E4EC` | Primary text |
| `--accent` | `#547A95` | `#C2A56D` | Buttons (blue light / gold dark) |
| `--accent2` | `#C2A56D` | `#C2A56D` | Gold, day labels |
| `--entry-bg` | `#FFFFFF` | `#1E2D3D` | Entry card background (opaque) |

Entry type colours: ♣ note `#C0706A` · ♠ task `#4A8C6A` · ♥ event `#7B6CA8` · ♦ idea `#C2A56D`

The app uses a dot-grid background, glassy frosted-glass UI elements (`backdrop-filter: blur`), and fully opaque entry cards to support the swipe-to-reveal interaction.

## 👥 Authors

| Role | Name |
|---|---|
| Design & development | Lucas França |

## 🤝 Related Tools

- 🌙 [**SleepDiaries**](https://github.com/lucasfr/SleepDiaries) — React Native sleep diary app for clinical research
- 🔬 [**circadia-bio**](https://github.com/circadia-bio) — the Circadia Lab GitHub organisation

## 📄 Licence

Released under the [MIT License](./LICENSE).

Copyright © Lucas França, 2026
