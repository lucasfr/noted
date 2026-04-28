import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, PanResponder, Vibration, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T, bulletColor, isEventType } from './tokens';
import { fmtTime, getTags } from './utils';

const SWIPE_WIDTH = 140;

export default function EntryCard({ entry, c, onEdit, onDelete, onToggleDone, privacyOn }) {
  const bc   = bulletColor(entry.type, c);
  const tags = getTags(entry.text);
  const tx   = useRef(new Animated.Value(0)).current;
  const revealed = useRef(false);
  const [unredacted, setUnredacted] = React.useState(false);
  const redactTimer = useRef(null);
  React.useEffect(() => { if (!privacyOn) setUnredacted(false); }, [privacyOn]);

  const handleReveal = () => {
    setUnredacted(true);
    clearTimeout(redactTimer.current);
    redactTimer.current = setTimeout(() => setUnredacted(false), 3000);
  };

  const reveal   = () => { Animated.spring(tx, { toValue: -SWIPE_WIDTH, useNativeDriver: true }).start(); revealed.current = true; };
  const collapse = () => { Animated.spring(tx, { toValue: 0,            useNativeDriver: true }).start(); revealed.current = false; };

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => { tx.setOffset(revealed.current ? -SWIPE_WIDTH : 0); tx.setValue(0); },
    onPanResponderMove: (_, g) => { tx.setValue(Math.max(-SWIPE_WIDTH, Math.min(0, g.dx))); },
    onPanResponderRelease: (_, g) => {
      tx.flattenOffset();
      g.dx < -40 ? reveal() : collapse();
    },
    onPanResponderTerminate: () => { tx.flattenOffset(); collapse(); },
  })).current;

  return (
    <View style={s.wrap}>
      {/* Actions revealed on swipe */}
      <View style={s.actions}>
        <TouchableOpacity style={[s.actionEdit, { backgroundColor: c.accent }]} onPress={() => { collapse(); onEdit(entry); }}>
          <Ionicons name="pencil-outline" size={20} color="#fff" />
          <Text style={s.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionDelete, { backgroundColor: '#c0392b' }]} onPress={() => { collapse(); onDelete(entry.id); }}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={s.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Entry card */}
      <Animated.View
        style={[s.card, { backgroundColor: c.entryBg, borderColor: c.glassBorder, transform: [{ translateX: tx }] }]}
        {...pan.panHandlers}
      >
        {/* Left accent bar */}
        <View style={[s.accent, { backgroundColor: bc }]} />

        <Text style={[s.time, { color: c.textMuted, fontFamily: T.fontBody }]}>
          {fmtTime(entry.timestamp)}
          {entry.type === 'task' && entry.done && entry.doneAt
            ? `\n✓ ${fmtTime(entry.doneAt)}`
            : ''}
        </Text>

        <Text style={[s.sym, { color: bc }]}>{entry.type === 'note' ? '♣' : entry.type === 'task' ? '♠' : entry.type === 'event' ? '♥' : '♦'}</Text>

        {entry.type === 'task' && (
          <TouchableOpacity
            onPress={() => { Vibration.vibrate(6); onToggleDone(entry.id); }}
            style={[s.checkbox, { borderColor: bc }, entry.done && { backgroundColor: bc }]}
          >
            {entry.done && <Text style={s.checkMark}>✓</Text>}
          </TouchableOpacity>
        )}

        <View style={s.body}>
          {privacyOn && !unredacted ? (
            <TouchableOpacity onPress={handleReveal} activeOpacity={0.8}>
              <View style={s.privacyMask} />
            </TouchableOpacity>
          ) : (
            <Text style={[
              s.text,
              { color: c.text, fontFamily: T.fontBody },
              entry.done && s.done,
            ]}>
              {entry.text}
            </Text>
          )}
          {tags.length > 0 && (
            <View style={s.tags}>
              {tags.map(t => (
                <View key={t} style={[s.tag, { backgroundColor: c.tagBg, borderColor: c.tagBorder }]}>
                  <Text style={[s.tagText, { color: c.accent, fontFamily: T.fontSemi }]}>#{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:        { borderRadius: T.radiusSm, marginBottom: 8, overflow: 'hidden' },
  actions:     { position: 'absolute', right: 0, top: 0, bottom: 0, width: SWIPE_WIDTH, flexDirection: 'row' },
  actionEdit:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionDelete:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionText:  { fontSize: 18, color: '#fff' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#fff' },
  card: {
    borderRadius:  T.radiusSm,
    borderWidth:   1,
    paddingVertical: 12,
    paddingLeft:   18,
    paddingRight:  14,
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           8,
    shadowColor:   '#2C3947',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     2,
  },
  accent:    { position: 'absolute', left: 0, top: 10, bottom: 10, width: 5, borderTopRightRadius: 3, borderBottomRightRadius: 3, opacity: 0.9 },
  time:      { fontSize: 14, fontWeight: '500', minWidth: 52, paddingTop: 2, flexShrink: 0 },
  sym:       { fontSize: 24, lineHeight: 28, width: 24, textAlign: 'center', paddingTop: 1 },
  checkbox:  { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body:      { flex: 1, minWidth: 0 },
  text:      { fontSize: 17, lineHeight: 28 },
  done:      { textDecorationLine: 'line-through', opacity: 0.5 },
  webActions:  { flexDirection: 'column', gap: 4, justifyContent: 'center' },
  webActionBtn:{ padding: 4, opacity: 0.6 },
  privacyMask:  { height: 20, borderRadius: 3, opacity: 1, marginVertical: 4, backgroundColor: '#2C3947' },
  tags:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  tag:       { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  tagText:   { fontSize: 13 },
});
