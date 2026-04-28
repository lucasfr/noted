import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T, TYPES, isEventType } from './tokens';

export default function EditModal({ visible, entry, c, theme, onSave, onCancel }) {
  const [text, setText] = useState(entry?.text || '');
  const [type, setType] = useState(entry?.type || 'note');

  // Reset when entry changes
  React.useEffect(() => {
    if (entry) { setText(entry.text); setType(entry.type); }
  }, [entry?.id]);

  if (!entry) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[s.card, {
          backgroundColor: theme === 'dark' ? 'rgba(26,35,48,0.98)' : 'rgba(244,246,248,0.98)',
          borderColor: c.glassBorder,
        }]}>
          <Text style={[s.title, { color: c.text, fontFamily: T.fontHead }]}>Edit entry</Text>

          {/* Type pills */}
          <View style={s.types}>
            {TYPES.map(t => {
              const active   = type === t.key;
              const evActive = isEventType(t.key);
              const activeBg = evActive
                ? (theme === 'dark' ? '#E8756A' : '#922B21')
                : (theme === 'dark' ? '#7EB8D4' : '#2C3E50');
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setType(t.key)}
                  style={[s.typePill, {
                    backgroundColor: active ? activeBg : c.glass,
                    borderColor:     active ? activeBg : c.glassBorder,
                  }]}
                >
                  <Text style={[s.typePillText, { color: active ? c.activeText : c.textMuted, fontFamily: T.fontSemi }]}>
                    {t.sym} {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Text input */}
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            style={[s.input, {
              color:           c.text,
              backgroundColor: c.glass,
              borderColor:     c.glassBorder,
              fontFamily:      T.fontBody,
            }]}
          />

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity onPress={onCancel} style={[s.cancelBtn, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
              <Text style={[s.cancelText, { color: c.textMuted, fontFamily: T.fontSemi }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(entry.id, text.trim(), type)} style={[s.saveBtn, { backgroundColor: c.accent }]}>
              <Text style={[s.saveText, { fontFamily: T.fontSemi }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(26,35,48,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:         { width: '100%', maxWidth: 400, borderRadius: T.radius, borderWidth: 1, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 40, elevation: 10 },
  title:        { fontSize: 20, marginBottom: 16 },
  types:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  typePill:     { borderRadius: 20, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 12 },
  typePillText: { fontSize: 13 },
  input:        { borderRadius: T.radiusSm, borderWidth: 1, padding: 13, fontSize: 17, lineHeight: 24, minHeight: 80, maxHeight: 160, marginBottom: 16 },
  actions:      { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelBtn:    { borderRadius: 20, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 16 },
  cancelText:   { fontSize: 13 },
  saveBtn:      { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  saveText:     { fontSize: 13, color: '#fff' },
});
