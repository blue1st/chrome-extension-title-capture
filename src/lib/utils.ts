export const DEFAULT_PATTERN = '<a href="${url}"><img src="${favIconUrl}"></img>${title}</a>';

export async function getPattern(): Promise<string> {
  const result = await chrome.storage.sync.get({ pattern: DEFAULT_PATTERN }) as { pattern: string };
  return result.pattern;
}

export async function savePattern(pattern: string): Promise<void> {
  await chrome.storage.sync.set({ pattern });
}

export interface CaptureTarget {
  title?: string;
  url?: string;
  favIconUrl?: string;
}

export function formatContent(pattern: string, target: CaptureTarget): string {
  let text = pattern;
  text = text.replace(/\$\{title\}/g, target.title || '');
  text = text.replace(/\$\{url\}/g, target.url || '');
  text = text.replace(/\$\{favIconUrl\}/g, target.favIconUrl || '');
  return text;
}

