import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { T } from './tokens';

export default function DotGrid({ color }) {
  const { width, height } = useWindowDimensions();

  const dots = useMemo(() => {
    const cols = Math.ceil(width  / T.dotSpacing) + 2;
    const rows = Math.ceil(height / T.dotSpacing) + 2;
    const out  = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push({ key: `${r}-${c}`, top: r * T.dotSpacing, left: c * T.dotSpacing });
      }
    }
    return out;
  }, [width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map(d => (
        <View key={d.key} style={[styles.dot, { top: d.top, left: d.left, backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', width: T.dotSize, height: T.dotSize, borderRadius: T.dotSize / 2 },
});
