import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  ScrollView, StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, TYPES } from './tokens';

const STEPS = [
  {
    icon: '🗒️',
    title: 'Welcome to Noted!',
    content: (c, T) => (
      <>
        <Text style={[s.p, { color: c.textMuted, fontFamily: T.fontBody }]}>
          A minimal bullet journal for capturing thoughts, tasks, events and ideas — all timestamped automatically.
        </Text>
        <View style={[s.box, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
          <Text style={[s.p, { color: c.textMuted, fontFamily: T.fontBody }]}>
            🔒 <Text style={{ color: c.text, fontFamily: T.fontSemi }}>Privacy-first.</Text> Everything stays on your device. No account, no server, no tracking. Privacy mode redacts your entries automatically.
          </Text>
        </View>
      </>
    ),
  },
  {
    icon: null,
    title: 'Four entry types',
    content: (c, T) => (
      <>
        <View style={s.suits}>
          {['♣️', '♥️', '♠️', '♦️'].map(s2 => <Text key={s2} style={s.suit}>{s2}</Text>)}
        </View>
        <Text style={[s.p, { color: c.textMuted, fontFamily: T.fontBody }]}>
          Choose your type before writing. Each gets its own colour and symbol.
        </Text>
        <View style={[s.box, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
          {[['♣️', 'Note', 'a thought or observation'], ['♥️', 'Event', 'something happening'], ['♠️', 'Task', 'something to do'], ['♦️', 'Idea', 'a spark worth keeping']].map(([sym, name, desc]) => (
            <Text key={name} style={[s.typeRow, { color: c.textMuted, fontFamily: T.fontBody }]}>
              {sym} <Text style={{ color: c.text, fontFamily: T.fontSemi }}>{name}</Text> — {desc}
            </Text>
          ))}
        </View>
      </>
    ),
  },
  {
    icon: '🏷️',
    title: 'Use #hashtags',
    content: (c, T) => (
      <>
        <Text style={[s.p, { color: c.textMuted, fontFamily: T.fontBody }]}>
          Add <Text style={{ color: c.text, fontFamily: T.fontSemi }}>#tags</Text> anywhere in your entry. They'll be shown as coloured pills automatically.
        </Text>
        <View style={[s.box, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
          <Text style={[s.p, { color: c.textMuted, fontFamily: T.fontBody, fontStyle: 'italic' }]}>
            e.g. Meeting went well #work #q2
          </Text>
        </View>
      </>
    ),
  },
  {
    icon: '📤',
    title: 'Export your entries',
    content: (c, T) => (
      <Text style={[s.p, { color: c.textMuted, fontFamily: T.fontBody }]}>
        Tap <Text style={{ color: c.text, fontFamily: T.fontSemi }}>Export</Text> in the menu to share your entries as JSON. Take them into your permanent notes app, spreadsheet, or anywhere else.
      </Text>
    ),
  },
  {
    icon: '👆',
    title: 'Swipe to edit or delete',
    content: (c, T) => (
      <Text style={[s.p, { color: c.textMuted, fontFamily: T.fontBody }]}>
        Swipe any entry to the <Text style={{ color: c.text, fontFamily: T.fontSemi }}>left</Text> to reveal Edit and Delete actions.{'\n\n'}Tap the checkbox on a task to mark it done — the completion time is recorded automatically.
      </Text>
    ),
  },
  {
    icon: '📲',
    title: "You're all set!",
    content: (c, T) => (
      <Text style={[s.p, { color: c.textMuted, fontFamily: T.fontBody }]}>
        Start capturing your thoughts, tasks, events and ideas. Everything gets a timestamp automatically.{'\n\n'}Tap the <Text style={{ color: c.text, fontFamily: T.fontSemi }}>Noted!</Text> logo anytime to revisit this information.
      </Text>
    ),
  },
];

export default function Onboarding({ visible, c, theme, onDone }) {
  const [step, setStep] = useState(0);
  const insets = useSafeAreaInsets();
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[s.backdrop, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={[s.card, {
          backgroundColor: theme === 'dark' ? 'rgba(26,35,48,0.98)' : 'rgba(244,246,248,0.98)',
          borderColor: c.glassBorder,
        }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {current.icon && <Text style={s.icon}>{current.icon}</Text>}
            <Text style={[s.title, { color: c.text, fontFamily: T.fontHead }]}>{current.title}</Text>
            {current.content(c, T)}
          </ScrollView>

          {/* Dots */}
          <View style={s.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[s.dot, { backgroundColor: i === step ? c.accent : c.textDim }]} />
            ))}
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity onPress={onDone}>
              <Text style={[s.skip, { color: c.textMuted, fontFamily: T.fontSemi }]}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => isLast ? onDone() : setStep(step + 1)}
              style={[s.nextBtn, { backgroundColor: c.accent }]}
            >
              <Text style={[s.nextText, { fontFamily: T.fontSemi }]}>{isLast ? 'Get started →' : 'Next →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(26,35,48,0.75)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  card:     { width: '100%', maxWidth: 420, borderRadius: T.radius, borderWidth: 1, padding: 32, maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 48, elevation: 12 },
  icon:     { fontSize: 48, lineHeight: 56 },
  suits:    { flexDirection: 'row', gap: 12, marginBottom: 4 },
  suit:     { fontSize: 36 },
  title:    { fontSize: 24, marginBottom: 4 },
  p:        { fontSize: 15, lineHeight: 24 },
  typeRow:  { fontSize: 14, lineHeight: 24 },
  box:      { borderRadius: T.radiusSm, borderWidth: 1, padding: 12, gap: 6 },
  dots:     { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 24, marginBottom: 16 },
  dot:      { width: 8, height: 8, borderRadius: 4 },
  actions:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skip:     { fontSize: 14, padding: 8 },
  nextBtn:  { borderRadius: 30, paddingVertical: 10, paddingHorizontal: 28 },
  nextText: { color: '#fff', fontSize: 15 },
});
