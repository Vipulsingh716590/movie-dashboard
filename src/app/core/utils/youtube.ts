const VIDEO_ID = /^[\w-]{11}$/;

/**
 * Accepts a YouTube link in any common form (watch?v=, youtu.be/, /embed/, /shorts/) or a bare 11-character video id,
 * and returns the video id, or null when the text is not a YouTube video.
 */
export function parseYoutubeKey(input: string): string | null {
  const text = (input ?? '').trim();
  if (!text) return null;
  if (VIDEO_ID.test(text)) return text;

  try {
    const url = new URL(text.includes('://') ? text : `https://${text}`);
    const host = url.hostname.replace(/^(www|m)\./, '');
    let candidate: string | null = null;

    if (host === 'youtu.be') {
      candidate = url.pathname.slice(1).split('/')[0];
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      candidate = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)?.[1] ?? null;
    }
    return candidate && VIDEO_ID.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export const youtubeWatchUrl = (key: string) => `https://www.youtube.com/watch?v=${key}`;
export const youtubeThumbUrl = (key: string) => `https://i.ytimg.com/vi/${key}/mqdefault.jpg`;
