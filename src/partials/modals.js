export default /* html */`
  <!-- Export modal -->
  <div class="modal-overlay" id="modal-overlay">
    <div class="modal">
      <div class="modal-handle"></div>
      <h2>Export entries</h2>
      <div class="export-preview" id="export-preview"></div>
      <div class="modal-actions">
        <button class="modal-btn" id="modal-close">Cancel</button>
        <button class="modal-btn primary" id="modal-copy">Copy</button>
        <button class="modal-btn primary" id="modal-download">Download</button>
      </div>
    </div>
  </div>

  <!-- About modal -->
  <div class="about-overlay" id="about-overlay">
    <div class="about-card">
      <button class="about-close" id="about-close" aria-label="Close">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <div class="about-logo">Noted<span>!</span></div>
      <p class="about-version">Version 1.0</p>
      <p class="about-desc">A minimal bullet journal for capturing thoughts, tasks, events and ideas — everything timestamped automatically.</p>
      <div class="about-types">
        <div class="about-type">
          <span class="about-type-sym" style="color:#547A95">·</span>
          <div><strong>Note</strong><span>A thought, observation or piece of information.</span></div>
        </div>
        <div class="about-type">
          <span class="about-type-sym" style="color:#4A8C6A">○</span>
          <div><strong>Task</strong><span>Something to do or follow up on.</span></div>
        </div>
        <div class="about-type">
          <span class="about-type-sym" style="color:#7B6CA8">◇</span>
          <div><strong>Event</strong><span>Something that happened or is happening.</span></div>
        </div>
        <div class="about-type">
          <span class="about-type-sym" style="color:#C2A56D">★</span>
          <div><strong>Idea</strong><span>A spark worth keeping hold of.</span></div>
        </div>
      </div>
      <div class="about-features">
        <span>#hashtags</span> for tagging ·
        <span>Export</span> to JSON for Claude →&thinsp;Obsidian ·
        <span>Privacy mode</span> with auto-blur
      </div>
      <p class="about-credit">Made with ❤️<br><a href="https://lfranca.uk" target="_blank" rel="noopener">lfranca.uk</a></p>
    </div>
  </div>

  <!-- Toast -->
  <div class="toast" id="toast"></div>
`;
