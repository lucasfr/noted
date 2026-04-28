import { useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';

// Speech recognition via Web Speech API (works on web/PWA)
// On native, requires @react-native-voice/voice with a dev build
let Voice = null;
try { Voice = require('@react-native-voice/voice').default; } catch {}

export function useSpeech({ onResult, onError }) {
  const [isListening, setIsListening] = useState(false);
  const baseText = useRef('');

  const start = useCallback(async (currentText) => {
    if (Platform.OS === 'web') {
      // Use Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) { onError?.('Speech not supported'); return; }

      const recognition = new SpeechRecognition();
      recognition.continuous     = false;
      recognition.interimResults = true;
      recognition.lang           = navigator.language || 'en-GB';

      baseText.current = currentText;
      setIsListening(true);

      recognition.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        const combined   = baseText.current + (baseText.current && transcript ? ' ' : '') + transcript;
        onResult(combined);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        const silenced = ['aborted', 'no-speech', 'audio-capture'];
        if (!silenced.includes(e.error)) onError?.('Mic error: ' + e.error);
        setIsListening(false);
      };

      recognition.start();
      return;
    }

    // Native — requires dev build
    if (!Voice) { onError?.('Speech requires a dev build'); return; }

    try {
      baseText.current = currentText;
      setIsListening(true);

      Voice.onSpeechResults = (e) => {
        const transcript = e.value?.[0] || '';
        const combined   = baseText.current + (baseText.current && transcript ? ' ' : '') + transcript;
        onResult(combined);
      };
      Voice.onSpeechEnd   = () => setIsListening(false);
      Voice.onSpeechError = () => setIsListening(false);

      await Voice.start('en-GB');
    } catch {
      setIsListening(false);
    }
  }, [onResult, onError]);

  const stop = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try { await Voice?.stop(); } catch {}
    setIsListening(false);
  }, []);

  return { isListening, start, stop };
}
