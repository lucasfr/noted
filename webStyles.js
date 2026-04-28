import { Platform } from 'react-native';

// Injects CSS for glassmorphism effects on web
// React Native Web doesn't support backdrop-filter via StyleSheet
export function injectWebStyles() {
  if (Platform.OS !== 'web') return;

  const style = document.createElement('style');
  style.textContent = `
    /* Header blur */
    [data-testid="header"] {
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
    }

    /* Modal overlays */
    [data-testid="modal-backdrop"] {
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
    }

    /* Drawer backdrop */
    [data-testid="drawer-backdrop"] {
      backdrop-filter: blur(6px) !important;
      -webkit-backdrop-filter: blur(6px) !important;
    }

    /* Input island */
    [data-testid="input-island"] {
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
    }

    /* Entry cards */
    [data-testid="entry-card"] {
      backdrop-filter: blur(0px);
      transition: box-shadow 0.15s ease;
    }
    [data-testid="entry-card"]:hover {
      box-shadow: 0 4px 16px rgba(44,57,71,0.12) !important;
    }

    /* Cursor */
    [role="button"], button { cursor: pointer; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(84,122,149,0.2); border-radius: 2px; }

    /* Remove tap highlight */
    * { -webkit-tap-highlight-color: transparent; }
  `;
  document.head.appendChild(style);
}
