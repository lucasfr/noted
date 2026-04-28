import { registerRootComponent } from 'expo';
import React, { useCallback, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import { SourceSans3_400Regular, SourceSans3_500Medium, SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3';
import { AppProvider, useApp } from './context';
import { LIGHT, DARK } from './tokens';
import { groupByDay, getTags } from './utils';
import DotGrid from './DotGrid';
import Header from './Header';
import EntryCard from './EntryCard';
import DayGroup from './DayGroup';
import EmptyState from './EmptyState';
import InputIsland from './InputIsland';
import AboutModal from './AboutModal';
import EditModal from './EditModal';
import SearchBar from './SearchBar';
import Toast from './Toast';
import Onboarding from './Onboarding';
import Drawer from './Drawer';

// Inject web-specific CSS
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    [class*="header"] { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
    [class*="backdrop"], [class*="overlay"] { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
    * { -webkit-tap-highlight-color: transparent; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(84,122,149,0.2); border-radius: 2px; }
  `;
  document.head.appendChild(style);
}

function Shell() {
  const { entries, setEntries, theme, themePref, cycleTheme, privacyOn, togglePrivacy, sortAsc, toggleSort, toast, showToast, onboarded, completeOnboarding, loaded } = useApp();
  const c = theme === 'dark' ? DARK : LIGHT;
  const scrollRef  = useRef(null);
  const collapseRef = useRef(null);

  const [showDrawer,  setShowDrawer]  = React.useState(false);
  const [showAbout,   setShowAbout]   = React.useState(false);
  const [editEntry,   setEditEntry]   = React.useState(null);
  const [showSearch,  setShowSearch]  = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredEntries = searchQuery
    ? entries.filter(e =>
        e.text.toLowerCase().includes(searchQuery) ||
        getTags(e.text).some(t => t.toLowerCase().includes(searchQuery.replace('#', '')))
      )
    : entries;
  const groups = groupByDay(filteredEntries, sortAsc);

  const addEntry = useCallback(({ text, type }) => {
    const e = { id: Crypto.randomUUID(), timestamp: Date.now(), type, text, done: false };
    const next = sortAsc ? [...entries, e] : [e, ...entries];
    setEntries(next);
    if (!sortAsc) scrollRef.current?.scrollTo({ y: 0, animated: true });
    else          scrollRef.current?.scrollToEnd({ animated: true });
  }, [entries, sortAsc, setEntries]);

  const saveEdit = useCallback((id, text, type) => {
    if (!text) return;
    setEntries(entries.map(e => e.id === id ? { ...e, text, type } : e));
    setEditEntry(null);
  }, [entries, setEntries]);

  const deleteEntry = useCallback((id) => {
    const doDelete = () => setEntries(entries.filter(e => e.id !== id));
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this entry?')) doDelete();
    } else {
      Alert.alert('Delete entry?', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [entries, setEntries]);

  const toggleDone = useCallback((id) => {
    setEntries(entries.map(e =>
      e.id === id ? { ...e, done: !e.done, doneAt: !e.done ? Date.now() : null } : e
    ));
  }, [entries, setEntries]);

  if (!loaded) return null;

  return (
    <View style={[s.root, { backgroundColor: c.bg }]} onStartShouldSetResponder={() => { collapseRef.current?.(); return false; }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <DotGrid color={c.dot} />

      <Header
        c={c}
        themePref={themePref}
        onTheme={cycleTheme}
        onMenu={() => setShowDrawer(true)}
        onLogo={() => setShowAbout(true)}
        onSearch={() => setShowSearch(true)}
      />

      {showSearch && (
        <SearchBar
          c={c}
          onSearch={setSearchQuery}
          onClose={() => { setShowSearch(false); setSearchQuery(''); }}
        />
      )}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => collapseRef.current?.()}
      >
        {groups.length === 0
          ? <EmptyState c={c} theme={theme} />
          : groups.map(({ key, day }) => (
              <DayGroup key={key} dayKey={key} day={day} c={c} entries={entries} setEntries={setEntries}>
                {day.map(entry => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    c={c}
                    privacyOn={privacyOn}
                    onEdit={(e) => setEditEntry(e)}
                    onDelete={deleteEntry}
                    onToggleDone={toggleDone}
                  />
                ))}
              </DayGroup>
            ))
        }
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <InputIsland c={c} theme={theme} onSubmit={addEntry} collapseRef={collapseRef} />
      </KeyboardAvoidingView>

      <Drawer
        visible={showDrawer}
        c={c}
        theme={theme}
        themePref={themePref}
        cycleTheme={cycleTheme}
        privacyOn={privacyOn}
        togglePrivacy={togglePrivacy}
        sortAsc={sortAsc}
        toggleSort={toggleSort}
        entries={entries}
        onClose={() => setShowDrawer(false)}
        onSearch={() => { setShowDrawer(false); setShowSearch(true); }}
      />

      <AboutModal
        visible={showAbout}
        c={c}
        theme={theme}
        entries={entries}
        onClose={() => setShowAbout(false)}
      />

      <EditModal
        visible={!!editEntry}
        entry={editEntry}
        c={c}
        theme={theme}
        onSave={saveEdit}
        onCancel={() => setEditEntry(null)}
      />

      <Toast message={toast} c={c} />

      <Onboarding
        visible={!onboarded}
        c={c}
        theme={theme}
        onDone={completeOnboarding}
      />
    </View>
  );
}

const s = StyleSheet.create({ root: { flex: 1 } });

function App() {
  const [fontsLoaded] = useFonts({
    LibreBaskerville_700Bold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
  });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
