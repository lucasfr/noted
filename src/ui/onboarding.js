const ONBOARDING_KEY = 'noted_onboarded';
const APP_VERSION    = '1.0.0-beta2';
const OB_TOTAL       = 7;

export function initOnboarding() {
  const overlay = document.getElementById('onboarding-overlay');
  let step = 1;

  function showStep(n) {
    for (let i = 1; i <= OB_TOTAL; i++) {
      document.getElementById(`ob-step-${i}`).style.display = i === n ? '' : 'none';
    }
    document.querySelectorAll('.ob-dot').forEach(d => {
      d.classList.toggle('active', +d.dataset.step === n);
    });
    document.getElementById('ob-next').textContent = n === OB_TOTAL ? 'Get started →' : 'Next →';
  }

  function close() {
    overlay.classList.remove('open');
    localStorage.setItem(ONBOARDING_KEY, APP_VERSION);
  }

  document.getElementById('ob-skip').addEventListener('click', close);
  document.getElementById('ob-next').addEventListener('click', () => {
    if (step < OB_TOTAL) { step++; showStep(step); }
    else close();
  });

  const seen = localStorage.getItem(ONBOARDING_KEY);
  const shouldShow = !seen || seen !== APP_VERSION;

  if (shouldShow) {
    // If this is an update (not first launch), jump to the last step
    // so returning users only see what's new, not the whole tour again
    if (seen && seen !== APP_VERSION) {
      step = OB_TOTAL;
    }
    showStep(step);
    requestAnimationFrame(() => overlay.classList.add('open'));
  }
}
