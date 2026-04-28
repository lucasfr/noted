import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSpeech } from './useSpeech';
import { T, TYPES, isEventType } from './tokens';

export default function InputIsland({ c, theme, onSubmit, collapseRef }) {
  const insets   = useSafeAreaInsets();
  const [text, setText]         = useState('');
  const [type, setType]         = useState('note');
  const [collapsed, setCollapsed] = useState(true);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const inputRef   = useRef(null);

  const expand = useCallback(() => {
    setCollapsed(false);
    Animated.timing(expandAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [expandAnim]);

  const collapse = useCallback(() => {
    if (text.trim()) return;
    Keyboard.dismiss();
    setCollapsed(true);
    Animated.timing(expandAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }, [text, expandAnim]);

  const { isListening, start, stop } = useSpeech({
    onResult: (t) => { setText(t); if (!collapsed) expand(); },
    onError:  (e) => console.warn(e),
  });

  const handleMic = () => {
    if (isListening) { stop(); return; }
    expand();
    start(text);
  };

  // expose collapse to parent
  if (collapseRef) collapseRef.current = collapse;

  const submit = useCallback(() => {
    if (!text.trim()) return;
    onSubmit({ text: text.trim(), type });
    setText('');
    collapse();
  }, [text, type, onSubmit, collapse]);

  const borderRadius = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [99, T.radius] });

  const isEvent = isEventType(type);
  const activeBg = isEvent
    ? (theme === 'dark' ? '#E8756A' : '#922B21')
    : (theme === 'dark' ? '#7EB8D4' : '#2C3E50');

  const islandBg     = theme === 'dark' ? '#2C3A4D' : c.bg;
  const islandBorder = theme === 'dark' ? 'rgba(126,184,212,0.20)' : c.glassBorder;

  return (
    <View style={[s.outer, { paddingBottom: insets.bottom + 12 }]}>
      <Animated.View style={[s.island, { backgroundColor: islandBg, borderColor: islandBorder, borderRadius }]}>

        {/* Type grid — only when expanded */}
        {!collapsed && (
          <View style={s.typeGrid}>
            {TYPES.map(t => {
              const active  = type === t.key;
              const evActive = isEventType(t.key);
              const bg = active
                ? (evActive ? (theme === 'dark' ? '#E8756A' : '#922B21') : (theme === 'dark' ? '#7EB8D4' : '#2C3E50'))
                : c.glass;
              const border = active
                ? bg
                : c.glassBorder;
              const textCol = active ? c.activeText : c.textMuted;
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setType(t.key)}
                  style={[s.typeBtn, { backgroundColor: bg, borderColor: border }]}
                >
                  <Text style={[s.typeSym,   { color: textCol }]}>{t.sym}</Text>
                  <Text style={[s.typeLabel, { color: textCol, fontFamily: T.fontSemi }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Input row */}
        <TouchableOpacity activeOpacity={1} onPress={collapsed ? expand : undefined} style={s.inputRow}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onFocus={expand}
            placeholder="capture a thought..."
            placeholderTextColor={c.textMuted}
            multiline={!collapsed}
            style={[
              s.input,
              { color: c.text, fontFamily: T.fontBody },
              collapsed
                ? { height: 36, fontSize: 14, backgroundColor: 'transparent', borderWidth: 0, paddingVertical: 6, paddingHorizontal: 12 }
                : { backgroundColor: c.glass, borderColor: c.glassBorder, borderWidth: 1, fontSize: 17, minHeight: 52, maxHeight: 120, padding: 13 },
            ]}
            returnKeyType="default"
            blurOnSubmit={false}
          />
          <TouchableOpacity onPress={handleMic} style={[s.micBtn, {
            backgroundColor: isListening ? 'rgba(192,57,43,0.08)' : c.glass,
            borderColor: isListening ? 'rgba(192,57,43,0.3)' : c.glassBorder,
            width: collapsed ? 36 : 52,
            height: collapsed ? 36 : 52,
            borderRadius: collapsed ? 99 : T.radiusSm,
          }]}>
            <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={collapsed ? 18 : 24} color={isListening ? '#c0392b' : c.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={submit}
            style={[
              s.submitBtn,
              { backgroundColor: c.accent },
              collapsed
                ? { width: 36, height: 36, borderRadius: 99 }
                : { width: 52, height: 52, borderRadius: T.radiusSm },
            ]}
          >
            <Text style={{ fontSize: 22, color: '#fff', fontWeight: '700' }}>↑</Text>
          </TouchableOpacity>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  outer:      { paddingHorizontal: T.padLg, paddingTop: 12, zIndex: 10, alignItems: 'center' },
  island:     { width: '100%', maxWidth: 680, borderWidth: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, shadowColor: '#547A95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 10 },
  typeGrid:   { flexDirection: 'row', gap: 6, marginBottom: 8 },
  typeBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 16, borderRadius: 30, borderWidth: 1, shadowColor: '#2C3947', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  typeSym:    { fontSize: 24 },
  typeLabel:  { fontSize: 16 },
  inputRow:   { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input:      { flex: 1, borderRadius: T.radiusSm },
  micBtn:    { width: 52, height: 52, borderRadius: T.radiusSm, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#2C3947', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  submitBtn:  { alignItems: 'center', justifyContent: 'center', shadowColor: '#547A95', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  submitText: { color: '#fff', fontWeight: '700' },
});
