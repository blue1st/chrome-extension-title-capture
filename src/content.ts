let lastClickedLinkText = '';

document.addEventListener('contextmenu', (event) => {
  const target = event.target as HTMLElement;
  const link = target.closest('a');
  if (link) {
    lastClickedLinkText = link.innerText.trim() || link.getAttribute('title') || '';
  } else if (target instanceof HTMLImageElement) {
    lastClickedLinkText = target.alt || target.title || '';
  } else {
    lastClickedLinkText = '';
  }
}, true);

chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.type === 'OPEN_CAPTURE_MENU') {
    const { title, url, isLink } = request.payload;
    const finalTitle = (isLink && lastClickedLinkText) ? lastClickedLinkText : title;
    showCaptureMenu(finalTitle, url);
  }
});

function isImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;
  return imageExtensions.test(url) || url.startsWith('data:image/');
}

function showCaptureMenu(title: string, url: string) {
  // Prevent multiple menus
  const existing = document.getElementById('title-capture-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'title-capture-container';
  const shadow = container.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .modal {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 20px;
      padding: 24px;
      width: 320px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes popIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    h2 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #1d1d1f;
      text-align: center;
    }
    .options {
      display: grid;
      gap: 10px;
    }
    button {
      background: white;
      border: 1px solid #e5e5e7;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      color: #1d1d1f;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;
      font-weight: 500;
    }
    button:hover {
      background: #f5f5f7;
      border-color: #0071e3;
      color: #0071e3;
      transform: translateY(-2px);
    }
    button:active {
      transform: translateY(0);
    }
    .preview-container {
      margin-top: 20px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .preview-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #86868b;
      margin-bottom: 6px;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .preview-text {
      font-size: 11px;
      color: #1d1d1f;
      word-break: break-all;
      font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
      line-height: 1.4;
      min-height: 1.4em;
    }
    .close-hint {
      margin-top: 16px;
      font-size: 12px;
      color: #86868b;
      text-align: center;
    }
  `;

  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const header = document.createElement('h2');
  header.textContent = 'Copy Format';
  modal.appendChild(header);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'options';

  const previewContainer = document.createElement('div');
  previewContainer.className = 'preview-container';
  const previewLabel = document.createElement('div');
  previewLabel.className = 'preview-label';
  previewLabel.textContent = 'Preview';
  const previewText = document.createElement('div');
  previewText.className = 'preview-text';
  previewContainer.appendChild(previewLabel);
  previewContainer.appendChild(previewText);

  const isImg = isImageUrl(url);
  const formats = [
    { 
      label: isImg ? 'HTML Image' : 'HTML Link', 
      format: () => isImg ? `<img src="${url}" alt="${title}">` : `<a href="${url}">${title}</a>` 
    },
    { 
      label: isImg ? 'Markdown Image' : 'Markdown', 
      format: () => isImg ? `![${title}](${url})` : `[${title}](${url})` 
    },
    { label: 'Title Only', format: () => title },
    { label: 'URL Only', format: () => url },
  ];

  // Set default preview
  previewText.textContent = formats[0].format();

  formats.forEach((f) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<span>${f.label}</span>`;
    btn.onmouseenter = () => {
      previewText.textContent = f.format();
    };
    btn.onclick = () => {
      copyToClipboard(f.format());
      container.remove();
      showToast('Copied!');
    };
    optionsContainer.appendChild(btn);
  });

  modal.appendChild(optionsContainer);
  modal.appendChild(previewContainer);

  const hint = document.createElement('div');
  hint.className = 'close-hint';
  hint.textContent = 'Click outside to cancel';
  modal.appendChild(hint);

  shadow.appendChild(style);
  shadow.appendChild(modal);

  document.body.appendChild(container);

  container.onclick = (e) => {
    if (e.target === container) container.remove();
  };
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for some sites with strict permissions
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

function showToast(message: string) {
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: '#1d1d1f',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '24px',
    zIndex: '2147483647',
    fontSize: '14px',
    fontWeight: '500',
    opacity: '0',
    transition: 'all 0.3s ease'
  });
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
