import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY    = 'noted_entries';
export const THEME_KEY      = 'noted_theme';
export const PRIVACY_KEY    = 'noted_privacy';
export const SORT_KEY       = 'noted_sort';
export const BLUR_DELAY_KEY = 'noted_blur_delay';
export const ONBOARDING_KEY = 'noted_onboarded';

export async function loadEntries() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveEntries(entries) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getSetting(key) {
  try { return await AsyncStorage.getItem(key); }
  catch { return null; }
}

export async function setSetting(key, value) {
  try { await AsyncStorage.setItem(key, String(value)); }
  catch {}
}

export async function removeSetting(key) {
  try { await AsyncStorage.removeItem(key); }
  catch {}
}
