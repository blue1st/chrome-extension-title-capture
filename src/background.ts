chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'show-capture-menu',
    title: 'Title Capture...',
    contexts: ['page', 'link', 'image']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'show-capture-menu') {
    let title = tab.title || '';
    let url = info.linkUrl || info.srcUrl || tab.url || '';

    // If it's a link, we'll try to get the link text from the content script 
    // when the menu is shown, or just use what we have.
    
    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_CAPTURE_MENU',
      payload: {
        title: title,
        url: url,
        isLink: !!(info.linkUrl || info.srcUrl)
      }
    });
  }
});
