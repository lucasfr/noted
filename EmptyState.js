import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from './tokens';

export default function EmptyState({ c, theme }) {
  return (
    <View style={s.wrap}>
      <View style={[s.card, {
        backgroundColor: theme === 'dark' ? 'rgba(44,57,71,0.35)' : 'rgba(255,255,255,0.40)',
        borderColor:     theme === 'dark' ? 'rgba(84,122,149,0.20)' : 'rgba(255,255,255,0.60)',
      }]}>
        <View style={[s.icon, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
          <Ionicons name="book-outline" size={36} color={c.accent} />
        </View>
        <Text style={[s.title, { color: c.text, fontFamily: T.fontHead }]}>Nothing noted yet</Text>
        <Text style={[s.sub, { color: c.textMuted, fontFamily: T.fontBody }]}>
          Capture notes, tasks, events and ideas.{'\n'}Everything gets a timestamp automatically.
        </Text>
        <View style={s.suits}>
          <Text style={s.suit}>♣️</Text>
          <Text style={s.suit}>♥️</Text>
          <Text style={s.suit}>♠️</Text>
          <Text style={s.suit}>♦️</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingTop: 60, paddingHorizontal: 0 },
  card:  { borderRadius: T.radius, borderWidth: 1, padding: 40, alignItems: 'center', gap: 16, width: '100%', maxWidth: 420, shadowColor: '#2C3947', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
  icon:  { width: 72, height: 72, borderRadius: T.radius, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, textAlign: 'center' },
  sub:   { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  suits: { flexDirection: 'row', gap: 14, opacity: 0.7, marginTop: 4 },
  suit:  { fontSize: 28 },
});
