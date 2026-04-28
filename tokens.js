export const T = {
  // ── Radii ──────────────────────────────────────────────────────────────────
  radius:   18,
  radiusSm: 14,
  radiusXl: 99,

  // ── Spacing ────────────────────────────────────────────────────────────────
  pad:  16,
  padLg: 24,

  // ── Typography ─────────────────────────────────────────────────────────────
  fontHead: 'LibreBaskerville_700Bold',
  fontBody: 'SourceSans3_400Regular',
  fontMed:  'SourceSans3_500Medium',
  fontSemi: 'SourceSans3_600SemiBold',

  // ── Dot grid ───────────────────────────────────────────────────────────────
  dotSpacing: 20,
  dotSize:    2,
};

export const LIGHT = {
  bg:           '#E8EDF2',
  bg2:          '#F2F5F8',
  text:         '#2C3947',
  textMuted:    '#7A90A0',
  textDim:      '#B0C0CC',
  accent:       '#547A95',
  accentDark:   '#3D5F75',
  accent2:      '#C2A56D',
  glass:        'rgba(255,255,255,0.25)',
  glassHover:   'rgba(255,255,255,0.45)',
  glassBorder:  'rgba(255,255,255,0.30)',
  shadow:       'rgba(44,57,71,0.08)',
  entryBg:      '#FFFFFF',
  entryBgHover: '#F4F7FA',
  headerBg:     'rgba(232,237,242,0.92)',
  islandBg:     '#E8EDF2',
  islandBorder: 'rgba(255,255,255,0.30)',
  modalBg:      'rgba(244,246,248,0.95)',
  drawerBg:     'rgba(244,246,248,0.95)',
  confirmBg:    'rgba(236,241,245,0.96)',
  handle:       'rgba(84,122,149,0.20)',
  tagBg:        'rgba(84,122,149,0.10)',
  tagBorder:    'rgba(84,122,149,0.22)',
  dot:          'rgba(84,122,149,0.25)',
  // entry accent colours
  noteColor:    '#2C3E50',
  eventColor:   '#922B21',
  // active type button
  noteActiveBg: '#2C3E50',
  eventActiveBg:'#922B21',
  activeText:   '#ffffff',
};

export const DARK = {
  bg:           '#1A2330',
  bg2:          '#222E3C',
  text:         '#D8E4EC',
  textMuted:    '#7A90A0',
  textDim:      '#3A4F5E',
  accent:       '#C2A56D',
  accentDark:   '#D4B87A',
  accent2:      '#C2A56D',
  glass:        'rgba(255,255,255,0.05)',
  glassHover:   'rgba(255,255,255,0.10)',
  glassBorder:  'rgba(255,255,255,0.04)',
  shadow:       'rgba(0,0,0,0.28)',
  entryBg:      '#1E2D3D',
  entryBgHover: '#243040',
  headerBg:     'rgba(26,35,48,0.92)',
  islandBg:     '#2C3A4D',
  islandBorder: 'rgba(126,184,212,0.20)',
  modalBg:      'rgba(26,35,48,0.95)',
  drawerBg:     'rgba(26,35,48,0.95)',
  confirmBg:    'rgba(22,32,44,0.97)',
  handle:       'rgba(84,122,149,0.28)',
  tagBg:        'rgba(84,122,149,0.15)',
  tagBorder:    'rgba(84,122,149,0.32)',
  dot:          'rgba(84,122,149,0.35)',
  noteColor:    '#7EB8D4',
  eventColor:   '#E8756A',
  noteActiveBg: '#7EB8D4',
  eventActiveBg:'#E8756A',
  activeText:   '#1A2330',
};

export const SYMBOLS = { note: '♣', task: '♠', event: '♥', idea: '♦' };

export const TYPES = [
  { key: 'note',  label: 'note',  sym: '♣️' },
  { key: 'event', label: 'event', sym: '♥️' },
  { key: 'task',  label: 'task',  sym: '♠️' },
  { key: 'idea',  label: 'idea',  sym: '♦️' },
];

export function isEventType(type) {
  return type === 'event' || type === 'idea';
}

export function bulletColor(type, c) {
  return isEventType(type) ? c.eventColor : c.noteColor;
}

export function activeTypeBg(type, c) {
  return isEventType(type) ? c.eventActiveBg : c.noteActiveBg;
}
