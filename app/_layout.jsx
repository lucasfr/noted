import { Stack } from 'expo-router';
import { Platform, View, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../context';
import { useFonts, LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import { SourceSans3_400Regular, SourceSans3_500Medium, SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3';

const isStandalone =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );

export default function RootLayout() {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? '#1A2330' : '#E8EDF2';
  const [fontsLoaded] = useFonts({
    LibreBaskerville_700Bold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
  });

  if (!fontsLoaded) return null;

  const content = (
    <SafeAreaProvider>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );

  if (Platform.OS === 'web' && isStandalone) {
    return <View style={[styles.webWrapperMobile, { backgroundColor: bg }]}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  webWrapperMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
