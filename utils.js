export function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function fmtDay(ts) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function getTags(text) {
  return [...text.matchAll(/#(\w+)/g)].map(m => m[1]);
}

export function groupByDay(entries, sortAsc) {
  const groups = {};
  entries.forEach(e => {
    const k = dayKey(e.timestamp);
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });
  return Object.entries(groups)
    .sort(([a],[b]) => sortAsc ? a.localeCompare(b) : b.localeCompare(a))
    .map(([key, day]) => ({
      key,
      day: [...day].sort((a,b) => sortAsc ? a.timestamp - b.timestamp : b.timestamp - a.timestamp),
    }));
}
