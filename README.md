# 🗒️ Noted

**A minimal, offline-first PWA for capturing timestamped bullet journal entries and exporting them to Obsidian.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![HTML](https://img.shields.io/badge/HTML-single--file-E34F26?logo=html5&logoColor=white)](./noted.html)
[![PWA](https://img.shields.io/badge/PWA-offline--ready-5A0FC8)](./noted.html)

---

## 📖 What is Noted?

Noted is a single-file progressive web app for bullet journalling on the go. Every entry gets a timestamp automatically. Entries are grouped by day, tagged with `#hashtags`, and typed as notes, tasks, events, or ideas. Everything lives in your browser's local storage — no account, no server, no tracking.

When you're ready to move entries into Obsidian, export them as a structured JSON file and paste it into Claude with the prompt: *"Convert this Noted JSON into an Obsidian Daily Note in markdown."*

## ✨ Features

- 📝 **Four entry types** — note `·`, task `○`, event `◇`, idea `★` — each colour-coded
- 🕐 **Automatic timestamps** on every entry, grouped by day
- **#hashtag detection** — tags are extracted and rendered inline
- 🌙 **Light and dark mode** — follows system preference, toggle in the header
- 💾 **localStorage persistence** — survives page reloads and browser restarts
- 📤 **JSON export** — copy to clipboard or download; structured for Claude → Obsidian conversion
- 📱 **PWA** — installable on iOS and Android, works fully offline
- 🎨 **Single HTML file** — no build step, no dependencies, drop it anywhere

## 🗂️ Project Structure

```
noted/
├── noted.html     # The entire app — HTML, CSS, and JS in one file
├── README.md
└── LICENSE
```

## 🚀 Getting Started

### Running locally

Just open `noted.html` in any modern browser:

```bash
open noted.html
```

Or serve it with any static server:

```bash
npx serve .
# then open http://localhost:3000/noted.html
```

### Deploying to GitHub Pages

1. Go to **Settings → Pages** in your repository
2. Set source to **Deploy from a branch → `main` → `/ (root)`**
3. The app will be live at `https://lucasfr.github.io/noted/noted.html`

### Installing as a PWA

On iOS: open the URL in Safari → Share → Add to Home Screen  
On Android: open in Chrome → browser menu → Add to Home Screen

### Exporting to Obsidian

1. Tap the **↓ download** icon in the header
2. Choose **Copy** or **Download** to get the JSON
3. Paste into Claude with the prompt:

```
Convert this Noted JSON into an Obsidian Daily Note in markdown
```

## 🎨 Customising

All design tokens are CSS variables at the top of the `<style>` block in `noted.html`. The palette uses four colours:

| Variable | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#E8EDF2` | `#1A2330` | Page background |
| `--text` | `#2C3947` | `#D8E4EC` | Primary text |
| `--accent` | `#547A95` | `#547A95` | Actions, buttons, note bullets |
| `--accent2` | `#C2A56D` | `#C2A56D` | Gold accent, day labels, idea bullets |

To swap the palette, edit the `:root` and `[data-theme="dark"]` blocks.

## 👥 Authors

| Role | Name |
|---|---|
| Design & development | Lucas França |

## 🤝 Related Tools

- 🌙 [**SleepDiaries**](https://github.com/lucasfr/SleepDiaries) — React Native sleep diary app for clinical research
- 🔬 [**circadia-bio**](https://github.com/circadia-bio) — the Circadia Lab GitHub organisation

## 📄 Licence

Released under the [MIT License](./LICENSE).

Copyright © Lucas França, 2025
