import { getPattern, savePattern } from './lib/utils';

async function initOptions() {
  const patternInput = document.getElementById('pattern') as HTMLTextAreaElement;
  const saveBtn = document.getElementById('save-btn');
  const status = document.getElementById('status');

  // Load existing setting
  const currentPattern = await getPattern();
  patternInput.value = currentPattern;

  saveBtn?.addEventListener('click', async () => {
    const newPattern = patternInput.value;
    await savePattern(newPattern);

    // Show status
    status?.classList.add('show');
    setTimeout(() => {
      status?.classList.remove('show');
    }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', initOptions);
