import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { SHARE_SIZES, parseShareFormat, shareCaption, type ShareFormat } from '@/lib/storefront.ts';
import { ShareKit } from './ShareKit';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ o?: string; f?: string }> };

export const metadata: Metadata = { title: 'Marketing' };

const FORMATS: ShareFormat[] = ['fb', 'square', 'story'];

/**
 * Marketing share kit (design screen 19): a post image in three sizes, a ready caption with an optional
 * campaign coupon, and a tracked link per channel. Built from the public offering page, so only published
 * offerings of the selling workspace can be shared. AI-written captions come with the AI gateway (ADR-014).
 */
export default async function MarketingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const here = `/w/${slug}/studio/marketing`;
  const { token, workspace } = await workspaceContext(slug, here);
  const store = await eduApi.storeHome().catch(() => null);
  const selling = store?.slug === workspace.slug;
  const offerings = selling ? store!.offerings : [];
  const chosen = offerings.find((offering) => offering.slug === query.o) ?? offerings[0];
  const format = parseShareFormat(query.f);
  const coupons = selling ? (await load(here, () => eduApi.coupons(token, workspace.id))).filter((coupon) => coupon.active).map((coupon) => coupon.code) : [];
  const origin = process.env.APP_URL?.replace(/\/$/, '') ?? 'https://edu.oxinov.com';
  const href = (o: string, f: ShareFormat) => `${here}?o=${encodeURIComponent(o)}&f=${f}`;

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1">
          <span className="studio-kicker tone-pink">// Marketing · share kit</span>
          <h1 className="studio-title">{chosen ? `Promote: ${chosen.title}` : 'Marketing'}</h1>
        </div>
        <span className="flex-1" />
        {chosen ? <span className="studio-status tone-success">● Published · ready to share</span> : null}
      </div>

      {!selling ? (
        <p className="notice">Only the Oxinov store workspace can share offerings publicly.</p>
      ) : !chosen ? (
        <p className="studio-panel px-5 py-4 text-muted">
          Publish an offering first. <Link href={`${here.replace('/marketing', '/offerings')}`}>Go to Offerings and prices</Link>
        </p>
      ) : (
        <>
          <form action={here} className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1">
              <span className="field-label">Offering</span>
              <select name="o" className="field" defaultValue={chosen.slug}>
                {offerings.map((offering) => (
                  <option key={offering.slug} value={offering.slug}>
                    {offering.title}
                  </option>
                ))}
              </select>
            </label>
            <input type="hidden" name="f" value={format} />
            <button type="submit" className="btn btn-secondary">
              Show
            </button>
          </form>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <section aria-labelledby="image-heading" className="grid gap-3">
              <h2 id="image-heading" className="sr-only">
                Post image
              </h2>
              <nav aria-label="Image size" className="flex flex-wrap gap-2">
                {FORMATS.map((value) => (
                  <Link key={value} href={href(chosen.slug, value)} className="store-chip text-sm" aria-current={value === format ? 'page' : undefined}>
                    {SHARE_SIZES[value].label}
                  </Link>
                ))}
              </nav>
              <div className="flex justify-center border border-line bg-surface p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated on the server for this offering */}
                <img
                  src={`/o/${chosen.slug}/share-image?format=${format}`}
                  alt={`Share image for ${chosen.title}`}
                  width={SHARE_SIZES[format].width}
                  height={SHARE_SIZES[format].height}
                  className="h-auto max-h-[36rem] w-auto max-w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`/o/${chosen.slug}/share-image?format=${format}`} download={`oxinov-${chosen.slug}-${format}.png`} className="btn btn-primary font-studio">
                  ⇩ Download image
                </a>
                <a href={`/o/${chosen.slug}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  Open the offering page
                </a>
              </div>
              <p className="studio-sub">Pasting the offering link on Facebook, WhatsApp, or Messenger shows the Facebook-size picture automatically.</p>
            </section>
            <ShareKit
              key={chosen.slug}
              origin={origin}
              slug={chosen.slug}
              coupons={coupons}
              captions={Object.fromEntries([['', shareCaption(chosen)], ...coupons.map((code) => [code, shareCaption(chosen, code)])])}
            />
          </div>
        </>
      )}
    </>
  );
}
