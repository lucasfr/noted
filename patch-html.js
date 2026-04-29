#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Replace viewport
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />'
);

// 2. Replace expo-reset style with SleepDiaries-style pwa-global + expo-reset
html = html.replace(
  /<style id="expo-reset">[\s\S]*?<\/style>/,
  `<style id="pwa-global">
    html, body {
        background: #E8EDF2;
        margin: 0;
        padding: 0;
        overflow: hidden;
        width: 100%;
        height: 100%;
    }
    @media (prefers-color-scheme: dark) {
        html, body { background: #1A2330; }
    }
    @media all and (display-mode: standalone) {
        html, body {
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            overflow: hidden;
            position: fixed;
            box-sizing: border-box;
        }
        #root {
            width: 100% !important;
            max-width: none !important;
            height: 100% !important;
            position: fixed !important;
            top: 0; left: 0; right: 0; bottom: 0;
            background: inherit;
        }
    }
    </style>
    <style id="expo-reset">
    #root, body, html { height: 100%; }
    body { overflow: hidden; }
    #root { display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; }
    </style>`
);

// 3. Add PWA meta tags after charset
html = html.replace(
  '<meta charset="utf-8" />',
  `<meta charset="utf-8" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Noted!" />`
);

// 4. Add dark theme-color
html = html.replace(
  '<meta name="theme-color" content="#E8EDF2">',
  `<meta name="theme-color" content="#E8EDF2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1A2330" media="(prefers-color-scheme: dark)">`
);

// 5. Add inline script to set background from stored theme before React mounts
html = html.replace(
  '<div id="root"></div>',
  `<script>
    try {
      var t = localStorage.getItem('noted_theme');
      var dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
      var bg = dark ? '#1A2330' : '#E8EDF2';
      document.documentElement.style.background = bg;
      document.body.style.background = bg;
    } catch(e) {}
  </script>
  <div id="root"></div>`
);

fs.writeFileSync(indexPath, html);
console.log('✅ PWA meta tags patched successfully');
