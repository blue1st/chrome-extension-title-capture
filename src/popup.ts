import { getPattern, formatContent } from './lib/utils';

async function initPopup() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const pattern = await getPattern();
  const formatted = formatContent(pattern, tab);

  const output = document.getElementById('output') as HTMLTextAreaElement;
  output.value = formatted;

  const copyBtn = document.getElementById('copy-btn');
  const toast = document.getElementById('toast');

  copyBtn?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(formatted);
    
    // Show toast
    toast?.classList.add('show');
    setTimeout(() => {
      toast?.classList.remove('show');
    }, 2000);
  });

  const optionsBtn = document.getElementById('options-btn');
  optionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

document.addEventListener('DOMContentLoaded', initPopup);
