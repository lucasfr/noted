export default /* html */`
  <div class="type-selector" id="type-selector">
    <button class="type-btn active note" data-type="note">· note</button>
    <button class="type-btn task" data-type="task">○ task</button>
    <button class="type-btn event" data-type="event">◇ event</button>
    <button class="type-btn idea" data-type="idea">★ idea</button>
  </div>
  <div class="input-row">
    <textarea id="entry-input" placeholder="capture a thought…" rows="1"></textarea>
    <button class="mic-btn" id="mic-btn" aria-label="Voice input" title="Voice input">
      <svg id="icon-mic" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/>
      </svg>
      <svg id="icon-mic-active" fill="currentColor" viewBox="0 0 24 24" style="display:none">
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z"/>
        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z"/>
      </svg>
    </button>
    <button class="submit-btn" id="submit-btn" aria-label="Add entry">
      <svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7"/>
      </svg>
    </button>
  </div>
`;
