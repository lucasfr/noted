import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import {
  loadEntries, saveEntries, getSetting, setSetting, removeSetting,
  THEME_KEY, PRIVACY_KEY, SORT_KEY, BLUR_DELAY_KEY, ONBOARDING_KEY,
} from './storage';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const system = useColorScheme();

  const [entries,    setEntriesRaw] = useState([]);
  const [themePref,  setThemePref]  = useState(null);   // null=auto 'light' 'dark'
  const [theme,      setTheme]      = useState('light');
  const [privacyOn,  setPrivacyOn]  = useState(false);
  const [sortAsc,    setSortAsc]    = useState(false);
  const [blurDelay,  setBlurDelayS] = useState(15000);
  const [onboarded,  setOnboarded]  = useState(true);
  const [toast,      setToast]      = useState(null);
  const [loaded,     setLoaded]     = useState(false);

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [raw, tp, priv, sort, blur, ob] = await Promise.all([
        loadEntries(),
        getSetting(THEME_KEY),
        getSetting(PRIVACY_KEY),
        getSetting(SORT_KEY),
        getSetting(BLUR_DELAY_KEY),
        getSetting(ONBOARDING_KEY),
      ]);
      setEntriesRaw(raw);
      setThemePref(tp || null);
      setPrivacyOn(priv === 'true');
      setSortAsc(sort === 'true');
      setBlurDelayS(parseInt(blur) || 15000);
      setOnboarded(ob === '1');
      setLoaded(true);
    })();
  }, []);

  // ── Resolve theme ─────────────────────────────────────────────────────────
  useEffect(() => {
    setTheme(themePref ? themePref : (system === 'dark' ? 'dark' : 'light'));
  }, [themePref, system]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  // ── Entries ───────────────────────────────────────────────────────────────
  const setEntries = useCallback(async (next) => {
    setEntriesRaw(next);
    try { await saveEntries(next); }
    catch { showToast('Storage full'); }
  }, [showToast]);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const cycleTheme = useCallback(async () => {
    const next = !themePref ? 'light' : themePref === 'light' ? 'dark' : null;
    setThemePref(next);
    if (next) await setSetting(THEME_KEY, next);
    else      await removeSetting(THEME_KEY);
  }, [themePref]);

  // ── Privacy ───────────────────────────────────────────────────────────────
  const togglePrivacy = useCallback(async () => {
    const next = !privacyOn;
    setPrivacyOn(next);
    await setSetting(PRIVACY_KEY, String(next));
  }, [privacyOn]);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const toggleSort = useCallback(async () => {
    const next = !sortAsc;
    setSortAsc(next);
    await setSetting(SORT_KEY, String(next));
  }, [sortAsc]);

  // ── Blur delay ────────────────────────────────────────────────────────────
  const setBlurDelay = useCallback(async (val) => {
    setBlurDelayS(val);
    await setSetting(BLUR_DELAY_KEY, String(val));
  }, []);

  // ── Onboarding ────────────────────────────────────────────────────────────
  const completeOnboarding = useCallback(async () => {
    setOnboarded(true);
    await setSetting(ONBOARDING_KEY, '1');
  }, []);

  return (
    <Ctx.Provider value={{
      entries, setEntries,
      theme, themePref, cycleTheme,
      privacyOn, togglePrivacy,
      sortAsc, toggleSort,
      blurDelay, setBlurDelay,
      onboarded, completeOnboarding,
      toast, showToast,
      loaded,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
