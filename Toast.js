import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './tokens';

export default function Toast({ message, c }) {
  const insets  = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!message) return;
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    return () => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 200, useNativeDriver: true }),
      ]).start();
    };
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[s.toast, {
      backgroundColor: c.accent,
      bottom: insets.bottom + 90,
      opacity,
      transform: [{ translateY }],
    }]}>
      <Text style={[s.text, { fontFamily: T.fontSemi }]}>{message}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toast: { position: 'absolute', alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, zIndex: 999, shadowColor: '#547A95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  text:  { color: '#fff', fontSize: 15 },
});
