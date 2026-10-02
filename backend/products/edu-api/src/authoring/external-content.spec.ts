import { authorUrl, embedUrl, liveProvider, parseDrive, parseExternal, parseYouTube, sourceProblem } from './external-content';

describe('external lesson links (ADR-028 point 5)', () => {
  it('reads every common YouTube link form', () => {
    for (const link of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
      'youtu.be/dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ?si=abc',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      ' dQw4w9WgXcQ ',
    ]) {
      expect(parseYouTube(link)).toBe('dQw4w9WgXcQ');
    }
  });

  it('refuses look-alike hosts, playlists, and malformed IDs', () => {
    expect(parseYouTube('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(parseYouTube('https://www.youtube.com/playlist?list=PL123')).toBeNull();
    expect(parseYouTube('https://www.youtube.com/watch?v=short')).toBeNull();
    expect(parseYouTube('javascript:alert(1)')).toBeNull();
    expect(parseYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ"><script>')).toBeNull();
  });

  it('reads Drive files and Google Docs, Slides, and Sheets links', () => {
    const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
    expect(parseDrive(`https://drive.google.com/file/d/${id}/view?usp=sharing`)).toBe(id);
    expect(parseDrive(`https://drive.google.com/open?id=${id}`)).toBe(id);
    expect(parseDrive(`https://docs.google.com/presentation/d/${id}/edit#slide=id.p`)).toBe(id);
    expect(parseDrive(`https://docs.google.com/document/d/${id}/edit`)).toBe(id);
    expect(parseDrive(`https://drive.google.com.evil.example/file/d/${id}/view`)).toBeNull();
    expect(parseDrive('https://drive.google.com/drive/folders/')).toBeNull();
  });

  it('chooses the provider and builds view-only player addresses', () => {
    expect(parseExternal('https://youtu.be/dQw4w9WgXcQ')).toEqual({ source: 'YOUTUBE', id: 'dQw4w9WgXcQ' });
    const drive = parseExternal('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view');
    expect(drive).toEqual({ source: 'GOOGLE_DRIVE', id: '1AbCdEfGhIjKlMnOpQrStUvWxYz012345' });
    expect(parseExternal('https://example.com/video.mp4')).toBeNull();
    expect(embedUrl({ source: 'YOUTUBE', id: 'dQw4w9WgXcQ' })).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1');
    expect(embedUrl(drive!)).toBe('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/preview');
  });
});

describe('live class links (ADR-028 point 8)', () => {
  it('names known meeting services and accepts other https links', () => {
    expect(liveProvider('https://meet.google.com/abc-defg-hij')).toBe('GOOGLE_MEET');
    expect(liveProvider('https://us02web.zoom.us/j/123456789')).toBe('ZOOM');
    expect(liveProvider('https://teams.microsoft.com/l/meetup-join/xyz')).toBe('MICROSOFT_TEAMS');
    expect(liveProvider('https://example.org/live')).toBe('OTHER');
  });

  it('refuses links that are not https', () => {
    expect(liveProvider('http://meet.google.com/abc-defg-hij')).toBeNull();
    expect(liveProvider('meet.google.com/abc-defg-hij')).toBeNull();
    expect(liveProvider('javascript:alert(1)')).toBeNull();
  });
});

describe('sources per lesson kind', () => {
  const youtube = { source: 'YOUTUBE', id: 'dQw4w9WgXcQ' } as const;
  const drive = { source: 'GOOGLE_DRIVE', id: '1AbCdEfGhIjKlMnOpQrStUvWxYz012345' } as const;
  it('lets video take YouTube or Drive and documents take Drive only', () => {
    expect(sourceProblem('VIDEO', youtube)).toBeNull();
    expect(sourceProblem('VIDEO', drive)).toBeNull();
    expect(sourceProblem('DOCUMENT', drive)).toBeNull();
    expect(sourceProblem('DOCUMENT', youtube)).toMatch(/Google Drive/);
    expect(sourceProblem('TEXT', drive)).toMatch(/Only video and document/);
    expect(sourceProblem('AUDIO', youtube)).toMatch(/Only video and document/);
  });

  it('gives authors the ordinary link', () => {
    expect(authorUrl(youtube)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(authorUrl(drive)).toBe('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view');
  });
});
