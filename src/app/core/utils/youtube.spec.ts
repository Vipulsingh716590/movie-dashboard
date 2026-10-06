import { parseYoutubeKey } from './youtube';

describe('parseYoutubeKey', () => {
  const id = 'YoHD9XEInc0';

  it('accepts a bare video id', () => expect(parseYoutubeKey(` ${id} `)).toBe(id));

  it('reads the common link forms', () => {
    for (const link of [
      `https://www.youtube.com/watch?v=${id}`,
      `https://www.youtube.com/watch?v=${id}&t=30s`,
      `https://m.youtube.com/watch?feature=share&v=${id}`,
      `youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}?si=abc`,
      `https://www.youtube.com/embed/${id}`,
      `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      `https://www.youtube.com/shorts/${id}`
    ]) {
      expect(parseYoutubeKey(link)).withContext(link).toBe(id);
    }
  });

  it('rejects anything that is not a YouTube video', () => {
    for (const text of ['', 'not a link', 'https://example.com/watch?v=YoHD9XEInc0', 'https://www.youtube.com/', 'short']) {
      expect(parseYoutubeKey(text)).withContext(text).toBeNull();
    }
  });
});
