#!/usr/bin/env node
// patch-html.js — runs after expo export to inject PWA meta tags
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Replace viewport
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />'
);

// Replace entire style block
html = html.replace(
  /<style id="expo-reset">[\s\S]*?<\/style>/,
  `<style id="expo-reset">
      html, body {
        height: 100%;
        background-color: #E8EDF2;
        background-image: radial-gradient(circle, rgba(84,122,149,0.25) 1px, transparent 1px);
        background-size: 20px 20px;
      }
      @media (prefers-color-scheme: dark) {
        html, body {
          background-color: #1A2330;
          background-image: radial-gradient(circle, rgba(84,122,149,0.35) 1px, transparent 1px);
        }
      }
      body { overflow: hidden; position: fixed; top: 0; left: 0; right: 0; bottom: 0; margin: 0; padding: 0; }
      #root { display: flex; height: 100%; flex: 1; }
      #root > div { min-height: 100dvh; }
    </style>`
);

// Add PWA meta tags after charset
html = html.replace(
  '<meta charset="utf-8" />',
  `<meta charset="utf-8" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Noted!" />`
);

// Add dark theme-color
html = html.replace(
  '<meta name="theme-color" content="#E8EDF2">',
  `<meta name="theme-color" content="#E8EDF2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1A2330" media="(prefers-color-scheme: dark)">`
);

fs.writeFileSync(indexPath, html);
console.log('✅ PWA meta tags patched successfully');
