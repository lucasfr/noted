import React from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Animated, Share, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T } from './tokens';

export default function Drawer({ visible, c, theme, themePref, cycleTheme, privacyOn, togglePrivacy, sortAsc, toggleSort, entries, onClose, onSearch }) {
  const insets = useSafeAreaInsets();

  const exportData = async () => {
    const data = JSON.stringify({
      exported_at: new Date().toISOString(),
      app: 'noted',
      version: '1.0.0-beta1',
      entries,
    }, null, 2);
    await Share.share({ message: data, title: 'noted-export.json' });
    onClose();
  };

  const themeIcon  = !themePref ? 'contrast-outline' : themePref === 'light' ? 'sunny-outline' : 'moon-outline';
  const themeLabel = !themePref ? 'Auto' : themePref === 'light' ? 'Light' : 'Dark';

  const BTNS = [
    { icon: themeIcon,                                     label: themeLabel,                        onPress: () => { cycleTheme(); onClose(); } },
    { icon: privacyOn ? 'eye-off-outline' : 'eye-outline',  label: privacyOn ? 'Private' : 'Visible', onPress: () => { togglePrivacy(); onClose(); } },
    { icon: sortAsc ? 'arrow-up-outline' : 'arrow-down-outline', label: sortAsc ? 'Oldest' : 'Newest', onPress: () => { toggleSort(); onClose(); } },
    { icon: 'search-outline',                              label: 'Search',                          onPress: onSearch },
    { icon: 'share-outline',                               label: 'Export',                          onPress: exportData },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <TouchableOpacity
            activeOpacity={1}
            style={[s.drawer, {
              backgroundColor: theme === 'dark' ? 'rgba(26,35,48,0.98)' : 'rgba(244,246,248,0.98)',
              borderColor: c.glassBorder,
              paddingBottom: insets.bottom + 16,
            }]}
          >
            <View style={[s.handle, { backgroundColor: c.handle }]} />
            <View style={s.row}>
              {BTNS.map(b => (
                <TouchableOpacity
                  key={b.label}
                  onPress={b.onPress}
                  style={[s.btn, { backgroundColor: c.glass, borderColor: c.glassBorder }]}
                >
                  <Ionicons name={b.icon} size={28} color={c.accent} />
                  <Text style={[s.btnLabel, { color: c.textMuted, fontFamily: T.fontSemi }]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(26,35,48,0.45)', justifyContent: 'flex-end' },
  sheet:    { width: '100%' },
  drawer:   { borderTopLeftRadius: T.radius, borderTopRightRadius: T.radius, borderWidth: 1, paddingHorizontal: 20, paddingTop: 12 },
  handle:   { width: 36, height: 4, borderRadius: 99, alignSelf: 'center', marginBottom: 20 },
  row:      { flexDirection: 'row', gap: 10, marginBottom: 8 },
  btn:      { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 8, borderRadius: T.radiusSm, borderWidth: 1 },
  btnIcon:  { fontSize: 24 },
  btnLabel: { fontSize: 12, textAlign: 'center' },
});
