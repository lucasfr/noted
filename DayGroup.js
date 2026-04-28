import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from './tokens';
import { fmtDay } from './utils';

export default function DayGroup({ dayKey, day, c, entries, setEntries, children }) {
  const label = fmtDay(day[0].timestamp).toUpperCase();

  const deleteDay = () => {
    const msg = `Delete all ${day.length} entr${day.length === 1 ? 'y' : 'ies'} from ${fmtDay(day[0].timestamp)}?`;
    const doDelete = () => setEntries(entries.filter(e => {
      const d = new Date(e.timestamp);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return k !== dayKey;
    }));
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doDelete();
    } else {
      Alert.alert(`Delete ${fmtDay(day[0].timestamp)}?`, `Remove all ${day.length} entries?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={s.group}>
      <View style={s.labelRow}>
        <Text style={[s.label, { color: c.accent2, fontFamily: T.fontSemi }]}>{label}</Text>
        <View style={[s.count, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
          <Text style={[s.countText, { color: c.textMuted, fontFamily: T.fontSemi }]}>{day.length}</Text>
        </View>
        <TouchableOpacity onPress={deleteDay} style={{ marginLeft: 'auto' }}>
          <Ionicons name="trash-outline" size={16} color={c.textDim} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  group:    { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 2 },
  label:    { fontSize: 13, letterSpacing: 0.8 },
  count:    { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 1 },
  countText:{ fontSize: 11 },
});
