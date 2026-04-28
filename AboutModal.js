import React from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  ScrollView, StyleSheet, Linking, Share, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T, TYPES } from './tokens';

const TYPE_DESCRIPTIONS = {
  note:  'A thought or observation.',
  task:  'Something to do or follow up on.',
  event: 'Something that happened or is happening.',
  idea:  'A spark worth keeping hold of.',
};

export default function AboutModal({ visible, c, theme, entries, onClose }) {
  const insets = useSafeAreaInsets();

  const exportData = async () => {
    const data = JSON.stringify({
      exported_at: new Date().toISOString(),
      app: 'noted',
      version: '1.0.0-beta1',
      entries,
    }, null, 2);
    await Share.share({ message: data, title: 'noted-export.json' });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[s.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={[s.card, {
          backgroundColor: theme === 'dark' ? 'rgba(26,35,48,0.98)' : 'rgba(244,246,248,0.98)',
          borderColor: c.glassBorder,
        }]}>
          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
            <Ionicons name="close" size={16} color={c.textMuted} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Logo */}
            <Text style={[s.logo, { color: c.text, fontFamily: T.fontHead }]}>
              Noted<Text style={{ color: c.accent2 }}>!</Text>
            </Text>
            <Text style={[s.version, { color: c.textMuted, fontFamily: T.fontBody }]}>Version 1.0.0-beta1</Text>

            {/* Description */}
            <Text style={[s.desc, { color: c.text, fontFamily: T.fontBody }]}>
              A minimal bullet journal for capturing thoughts, tasks, events and ideas — everything timestamped automatically.
            </Text>

            {/* Types */}
            <View style={[s.types, {
              backgroundColor: theme === 'dark' ? 'rgba(26,35,48,0.70)' : 'rgba(255,255,255,0.70)',
              borderColor: c.glassBorder,
            }]}>
              {TYPES.map(t => (
                <View key={t.key} style={s.typeRow}>
                  <Text style={s.typeSym}>{t.sym}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.typeName, { color: c.text, fontFamily: T.fontSemi }]}>{t.label}</Text>
                    <Text style={[s.typeSub, { color: c.textMuted, fontFamily: T.fontBody }]}>{TYPE_DESCRIPTIONS[t.key]}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Features */}
            <Text style={[s.features, { color: c.textMuted, fontFamily: T.fontBody }]}>
              <Text style={{ color: c.accent, fontFamily: T.fontSemi }}>#hashtags</Text> for tagging · <Text style={{ color: c.accent, fontFamily: T.fontSemi }}>Export</Text> to JSON · <Text style={{ color: c.accent, fontFamily: T.fontSemi }}>Privacy mode</Text> with auto-blur
            </Text>

            {/* Footer */}
            <View style={[s.footer, { borderTopColor: c.glassBorder }]}>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://github.com/lucasfr/noted')}
                style={[s.githubBtn, { backgroundColor: c.glass, borderColor: c.glassBorder }]}
              >
                <Ionicons name="logo-github" size={18} color={c.text} />
                <Text style={[s.githubText, { color: c.text, fontFamily: T.fontSemi }]}>Contribute on GitHub</Text>
              </TouchableOpacity>

              <Text style={[s.license, { color: c.textMuted, fontFamily: T.fontBody }]}>
                Released under the MIT License · free to use, modify and distribute.
              </Text>
              <Text style={[s.credit, { color: c.textMuted, fontFamily: T.fontBody }]}>
                Made with ❤️  lfranca.uk
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(26,35,48,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  card:       { width: '100%', maxWidth: 400, borderRadius: T.radius, borderWidth: 1, padding: 32, maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 40, elevation: 10 },
  closeBtn:   { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  logo:       { fontSize: 32, marginBottom: 4 },
  version:    { fontSize: 13, marginBottom: 16 },
  desc:       { fontSize: 15, lineHeight: 24, marginBottom: 20 },
  types:      { borderRadius: T.radiusSm, borderWidth: 1, padding: 16, marginBottom: 20, gap: 10 },
  typeRow:    { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  typeSym:    { fontSize: 20, width: 28, textAlign: 'center' },
  typeName:   { fontSize: 13, marginBottom: 2 },
  typeSub:    { fontSize: 12, lineHeight: 18 },
  features:   { fontSize: 13, lineHeight: 26, marginBottom: 12, textAlign: 'center' },
  footer:     { borderTopWidth: 1, paddingTop: 12, marginTop: 4, alignItems: 'center', gap: 10 },
  githubBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 30, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 20 },
  githubText: { fontSize: 14 },
  license:    { fontSize: 12, textAlign: 'center' },
  credit:     { fontSize: 13, textAlign: 'center' },
});
