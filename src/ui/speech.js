export function initSpeech({ getTextarea, showToast }) {
  const micBtn            = document.getElementById('mic-btn');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micBtn.style.display = 'none';
    return;
  }

  const recognition          = new SpeechRecognition();
  recognition.continuous     = false;
  recognition.interimResults = true;
  recognition.lang           = navigator.language || 'en-GB';

  let isListening = false;
  let baseText    = '';
  let stopTimeout = null;

  function setMicUI(active) {
    micBtn.classList.toggle('mic-active', active);
    document.getElementById('icon-mic').style.display        = active ? 'none'  : 'block';
    document.getElementById('icon-mic-active').style.display = active ? 'block' : 'none';
  }

  function cleanupListening() {
    isListening = false;
    clearTimeout(stopTimeout);
    stopTimeout = null;
    setMicUI(false);
  }

  function startListening() {
    if (isListening) return;
    const textarea = getTextarea();
    isListening = true;
    baseText    = textarea.value;
    setMicUI(true);
    try { recognition.start(); }
    catch { recognition.abort(); cleanupListening(); }
  }

  function stopListening() {
    if (!isListening) return;
    try { recognition.stop(); } catch { cleanupListening(); }
    stopTimeout = setTimeout(cleanupListening, 2000);
  }

  recognition.addEventListener('result', e => {
    const textarea   = getTextarea();
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    textarea.value   = baseText + (baseText && transcript ? ' ' : '') + transcript;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });

  recognition.addEventListener('end', cleanupListening);

  recognition.addEventListener('error', e => {
    const silenced = ['aborted', 'no-speech', 'audio-capture'];
    if (!silenced.includes(e.error)) showToast('Mic error: ' + e.error);
    cleanupListening();
  });

  micBtn.addEventListener('click', () => {
    isListening ? stopListening() : startListening();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isListening) stopListening();
  });
}
