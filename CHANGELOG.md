# Changelog

All notable changes to Noted! are documented here.

---

## [1.0.0-beta2] — 2026-04-29

### ✨ Features
- **GitHub sync** — entries sync automatically to a private GitHub repository on every save; pull from any other device on demand
- **⌘S force sync** — immediately push to the remote repo without saving a new entry
- **Sync status indicator** — header icon reflects idle / syncing / ok / error state in real time

### 🔒 Security
- Sync backend switched from GitHub Gist (secret but URL-accessible) to a proper **private repository** — truly inaccessible without the token
- Token validation on connect — rejects invalid tokens, wrong scopes, and public repos

### 🎨 UI
- Sync settings modal matches the About modal transparency and is always centred on screen
- Shortcuts screen redesigned: opaque card, two-column grid layout, entries grouped into Navigation / Actions / Entry types sections with descriptive labels
- `kbd` keys aligned to the right of each row for easier scanning

### ⌨️ Shortcuts
- `⌘S` — force sync to GitHub
- `Esc` — now also closes the sync modal

---

## [1.0.0-beta1] — 2026-04-27

First public pre-release.

### ✨ Features
- Four entry types — ♣ note, ♠ task, ♥ event, ♦ idea — each colour-coded with a left accent stripe
- Automatic timestamps on every entry, grouped by day
- Per-day delete with confirmation
- #hashtag detection — tags extracted and rendered as inline pills
- Task completion — tap to mark done with strikethrough
- Swipe left to reveal Edit and Delete actions on any entry
- Inline editing with type switching
- Privacy mode — blur all entry text; auto-reveals on hover, auto-hides after 15 s
- Theme cycling — Auto / Light / Dark, follows system preference
- Voice input via Web Speech API
- Search — filter entries by text or #tag (⌘F)
- JSON export — copy or download
- Markdown export — copy as formatted Markdown
- JSON import — restore from backup; duplicates skipped automatically
- Keyboard shortcuts — press `?` for full list
- Onboarding — guided walkthrough on first launch with PWA install instructions
- Mobile hamburger menu with bottom drawer
- Dot-grid background with glassy frosted-glass UI elements
- PWA — installable on iOS, Android and desktop, works fully offline

### 🐛 Fixes
- Collapsed input pill positioning and safe area handling on iOS
- Status bar colour consistency in standalone PWA mode
- Empty state card suit symbols rendered correctly across platforms
- Task entries show symbol alongside checkbox
</content>