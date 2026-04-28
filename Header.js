import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T } from './tokens';

const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short',
});

export default function Header({ c, themePref, onTheme, onMenu, onLogo, onSearch }) {
  const insets = useSafeAreaInsets();
  const themeIcon = !themePref ? 'contrast-outline' : themePref === 'light' ? 'sunny-outline' : 'moon-outline';

  return (
    <View style={[s.header, {
        backgroundColor: c.headerBg,
        borderBottomColor: c.glassBorder,
        paddingTop: insets.top + 14,
    }]}>
      <View style={s.left}>
        <TouchableOpacity onPress={onLogo}>
          <Text style={[s.logo, { color: c.text, fontFamily: T.fontHead }]}>
            Noted<Text style={{ color: c.accent2 }}>!</Text>
          </Text>
        </TouchableOpacity>
        <Text style={[s.date, { color: c.textMuted, fontFamily: T.fontBody }]} numberOfLines={1}>
          {today}
        </Text>
      </View>
      <View style={s.actions}>
        <TouchableOpacity onPress={onTheme} style={[s.iconBtn, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
          <Ionicons name={themeIcon} size={20} color={c.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSearch} style={[s.iconBtn, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
          <Ionicons name="search-outline" size={20} color={c.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onMenu} style={[s.iconBtn, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
          <Ionicons name="menu-outline" size={22} color={c.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: T.pad,
    paddingBottom:    12,
    borderBottomWidth: 1,
    zIndex:           100,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           8,
    flex:          1,
    minWidth:      0,
  },
  logo: {
    fontSize: 26,
  },
  date: {
    fontSize:   13,
    fontWeight: '500',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap:           8,
    flexShrink:    0,
  },
  iconBtn: {
    width:          42,
    height:         42,
    borderRadius:   10,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#2C3947',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.18,
    shadowRadius:   6,
    elevation:      3,
  },
});
