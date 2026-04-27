const ONBOARDING_KEY = 'noted_onboarded';
const OB_TOTAL       = 6;

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
    localStorage.setItem(ONBOARDING_KEY, '1');
  }

  document.getElementById('ob-skip').addEventListener('click', close);
  document.getElementById('ob-next').addEventListener('click', () => {
    if (step < OB_TOTAL) { step++; showStep(step); }
    else close();
  });

  if (!localStorage.getItem(ONBOARDING_KEY)) {
    showStep(1);
    requestAnimationFrame(() => overlay.classList.add('open'));
  }
}
