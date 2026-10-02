import type { ContentSource } from '@/lib/edu-api.ts';
import { isViewerUrl } from '@/lib/content.ts';

/**
 * View-only player for YouTube and Google Drive lessons (ADR-028 point 6): YouTube's privacy-enhanced
 * embed or Drive's preview, framed inside Oxinov with no download control and the viewer's email drawn
 * across it. This deters casual sharing; it cannot stop screen recording, and the store says so.
 */
export function ExternalViewer({ source, embedUrl, title, watermark }: { source: ContentSource; embedUrl: string; title: string; watermark: string }) {
  // Only the two provider addresses the API builds are ever framed.
  if (!isViewerUrl(embedUrl)) return <p className="notice">This lesson cannot be shown right now.</p>;
  const video = source === 'YOUTUBE';
  return (
    <figure className="grid gap-2">
      <div className={`viewer-frame ${video ? 'aspect-video' : 'viewer-document'}`}>
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow={video ? 'encrypted-media; picture-in-picture; fullscreen' : 'fullscreen'}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          loading="lazy"
        />
        <span className="viewer-watermark" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index}>{watermark}</span>
          ))}
        </span>
      </div>
      <figcaption className="hud-label">// {video ? 'Plays inside Oxinov' : 'View only'} · licensed to {watermark}</figcaption>
    </figure>
  );
}
