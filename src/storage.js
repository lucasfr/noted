export const STORAGE_KEY  = 'noted_entries';
export const THEME_KEY    = 'noted_theme';
export const PRIVACY_KEY  = 'noted_privacy';
export const SORT_KEY     = 'noted_sort';
export const BLUR_DELAY_KEY = 'noted_blur_delay';
export const SYMBOLS      = { note: '♣', task: '♠', event: '♥', idea: '♦' };

export let entries = [];

export function load() {
  try { entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { entries = []; }
}

export function save(showToast) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    showToast('Storage full — oldest entries may not be saved');
  }
}

export function setEntries(newEntries) {
  entries = newEntries;
}
