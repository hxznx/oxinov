import { ImageResponse } from 'next/og';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { formatNpr } from '@/lib/store.ts';
import { CATEGORY_LABELS, KIND_LABELS, SHARE_SIZES, parseShareFormat } from '@/lib/storefront.ts';

const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;
const ACCENT: Record<string, string> = { LANGUAGES: '#00F0FF', TECHNOLOGY: '#C040FF', IDEAS_RESEARCH: '#FF3EEC', OTHER: '#FCEE0A' };

/**
 * Share picture for one published offering (design screen 19): the post image in the share kit, and the
 * preview image Facebook, WhatsApp, and Messenger show for an offering link (Open Graph). Public, because
 * it shows only what the public offering page shows.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await params;
  if (!SLUG.test(slug)) return new Response('Not found', { status: 404 });
  let offering;
  try {
    offering = await eduApi.storeOffering(slug);
  } catch (error) {
    if (error instanceof EduApiError && error.status === 404) return new Response('Not found', { status: 404 });
    throw error;
  }
  const format = parseShareFormat(new URL(request.url).searchParams.get('format'));
  const { width, height } = SHARE_SIZES[format];
  const tall = format === 'story';
  const accent = ACCENT[offering.category] ?? '#00F0FF';
  const price = offering.free ? 'FREE TO LEARN' : offering.hasPlans ? `FROM ${formatNpr(offering.fromMinor)}` : '';
  const scale = format === 'fb' ? 1 : format === 'story' ? 1.6 : 1.35;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: `${56 * scale}px`,
          backgroundColor: '#07070D',
          backgroundImage: 'linear-gradient(#16163A 1px, transparent 1px), linear-gradient(90deg, #16163A 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          color: '#E6F1FF',
          border: `6px solid ${accent}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26 * scale, letterSpacing: 4 }}>
          <span style={{ color: '#00F0FF', fontWeight: 700 }}>OXINOV // EDU</span>
          <span style={{ color: offering.free || offering.freeLessonCount > 0 ? '#00FF9C' : '#8B9BB4' }}>
            {offering.free ? '● FREE' : offering.freeLessonCount > 0 ? '● FREE PREVIEW' : '● SYLLABUS OPEN'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 * scale, marginTop: tall ? 200 : 0 }}>
          <span style={{ display: 'flex', alignSelf: 'flex-start', padding: '6px 16px', background: accent, color: '#07070D', fontSize: 24 * scale, letterSpacing: 3 }}>
            {`${KIND_LABELS[offering.kind]} · ${CATEGORY_LABELS[offering.category]}`.toUpperCase()}
          </span>
          <span style={{ fontSize: (offering.title.length > 40 ? 58 : 72) * scale, fontWeight: 800, lineHeight: 1.05, textTransform: 'uppercase' }}>{offering.title}</span>
          <span style={{ fontSize: 30 * scale, color: '#C9D4E5', lineHeight: 1.35 }}>{offering.summary}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 28 * scale }}>
          <span style={{ color: '#FCEE0A', letterSpacing: 2 }}>{price}</span>
          <span style={{ color: '#8B9BB4' }}>edu.oxinov.com</span>
        </div>
      </div>
    ),
    { width, height },
  );
  image.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return image;
}
