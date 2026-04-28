import React, { useRef, useState } from 'react';
import {
  View, TextInput, TouchableOpacity,
  StyleSheet, Animated, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from './tokens';

export default function SearchBar({ c, onSearch, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, { toValue: -60, duration: 150, useNativeDriver: true }).start(() => onClose());
    onSearch('');
  };

  const handleChange = (text) => {
    setQuery(text);
    onSearch(text.toLowerCase().trim());
  };

  return (
    <Animated.View style={[s.bar, { backgroundColor: c.headerBg, borderBottomColor: c.glassBorder, transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name="search-outline" size={18} color={c.textMuted} />
      <TextInput
        ref={inputRef}
        value={query}
        onChangeText={handleChange}
        placeholder="Search entries..."
        placeholderTextColor={c.textDim}
        style={[s.input, { color: c.text, fontFamily: T.fontBody }]}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <TouchableOpacity onPress={handleClose}>
        <Ionicons name="close-outline" size={22} color={c.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  bar:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  input: { flex: 1, fontSize: 16, height: 36 },
});
