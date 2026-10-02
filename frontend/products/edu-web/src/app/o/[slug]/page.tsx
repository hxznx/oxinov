import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { LessonMarkdown } from '@/components/LessonMarkdown';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type StoreOfferingDetail } from '@/lib/edu-api.ts';
import { formatDate, formatDuration, formatPrice } from '@/lib/format.ts';
import { PLAN_PERIODS, type PlanPeriod } from '@/lib/store.ts';
import { CATEGORY_LABELS, CATEGORY_TONES, KIND_LABELS, isIntellectualProperty } from '@/lib/storefront.ts';
import { LocalTime } from '@/components/LocalTime';
import { ratingLabel, starShares, stars } from '@/lib/reviews.ts';
import { EnterButton, PlanPicker } from './PlanPicker';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ plan?: string; problem?: string }> };

const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;
const SUPPORT = 'support@oxinov.com';
const LESSON_ICONS: Record<string, string> = { VIDEO: '▶', AUDIO: '♪', TEXT: '▤', DOCUMENT: '▣', QUIZ: '?', EXAM: '?' };
const PROBLEMS: Record<string, string> = {
  suspended: `Your access to the Oxinov store is suspended. Write to ${SUPPORT}.`,
  unavailable: 'We could not open the course just now. Please try again in a moment.',
};

async function loadOffering(slug: string): Promise<StoreOfferingDetail> {
  if (!SLUG.test(slug)) notFound();
  try {
    return await eduApi.storeOffering(slug);
  } catch (error) {
    if (error instanceof EduApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const offering = await loadOffering(slug);
    // Link previews on Facebook, WhatsApp, and Messenger show the share picture (design screen 19).
    const image = { url: `/o/${slug}/share-image?format=fb`, width: 1200, height: 630, alt: offering.title };
    return {
      title: offering.title,
      description: offering.summary,
      openGraph: { type: 'website', siteName: 'Oxinov Edu', title: offering.title, description: offering.summary, url: `/o/${slug}`, images: [image] },
      twitter: { card: 'summary_large_image', title: offering.title, description: offering.summary, images: [image.url] },
    };
  } catch {
    return { title: 'Offering' };
  }
}

/**
 * Offering page (ADR-028; design screens 2 and 13): introduction, what is included, the syllabus with free
 * and locked items, plans with end dates, and questions. Ideas and think-tank research add the content
 * license. Anyone can read it; lesson content stays behind sign-in and a plan.
 */
export default async function OfferingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const offering = await loadOffering(slug);
  const session = await auth.currentSession(`/o/${slug}`);
  const ip = isIntellectualProperty(offering.kind);
  const tone = ip ? '--ox-color-brand-2' : CATEGORY_TONES[offering.category];
  const initial = PLAN_PERIODS.find((period) => period === query.plan) as PlanPeriod | undefined;

  // A signed-in learner who already has access goes straight to learning.
  let access: { workspaceSlug: string; endsAt: string | null } | null = null;
  if (session) {
    try {
      const workspace = (await eduApi.workspaces(session.accessToken)).find((item) => item.slug === offering.storeSlug);
      if (workspace) {
        const info = await eduApi.checkoutInfo(session.accessToken, workspace.id, offering.id);
        if (info.owned) access = { workspaceSlug: workspace.slug, endsAt: info.accessEndsAt };
      }
    } catch {
      access = null;
    }
  }

  const lessons = offering.curriculum.flatMap((section) => section.lessons);
  const totalMinutes = Math.round(lessons.reduce((sum, lesson) => sum + (lesson.durationSec ?? 0), 0) / 60);
  const included = [
    `${offering.lessonCount} lesson${offering.lessonCount === 1 ? '' : 's'}${totalMinutes >= 10 ? `, about ${totalMinutes >= 120 ? `${Math.round(totalMinutes / 60)} hours` : `${totalMinutes} minutes`} of video and audio` : ''}`,
    offering.freeLessonCount > 0 ? `${offering.freeLessonCount} free preview lesson${offering.freeLessonCount === 1 ? '' : 's'} before you pay` : 'Introduction and syllabus free to read',
    'Study on your phone or computer, any time during your plan',
    'Renew early and the new time is added to the end',
  ];
  const faq = [
    {
      q: 'How do I pay?',
      a: `Choose a plan and scan the Oxinov bank QR with your bank or wallet app, with the payment reference in the remarks. Then send the transaction ID and a screenshot. We check it and unlock the course (${offering.reviewTimeText.toLowerCase()}).`,
    },
    { q: 'When does my access start and end?', a: 'It starts when your payment is approved and ends after the plan length. If you renew early, the new time is added to the end, so you never lose paid days.' },
    { q: 'Can I study on my phone?', a: 'Yes. Open edu.oxinov.com on your phone and sign in with the same email.' },
    { q: 'What if it is not right for me?', a: offering.refundPolicy.trim() || `Write to ${SUPPORT} and we will help.` },
  ];

  return (
    <>
      <EduHeader signedIn={session !== null} returnTo={`/o/${slug}`} />
      <main id="main" style={{ ['--tone' as string]: `var(${tone})` }}>
        <section className={`border-b border-line ${ip ? 'hex-bg' : 'grid-bg'}`}>
          <div className="store-wrap grid gap-10 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:py-14">
            <div className="grid content-start gap-5">
              <nav aria-label="Breadcrumb" className="text-hud text-sm text-muted">
                <Link href="/" className="text-muted">
                  Store
                </Link>{' '}
                / {CATEGORY_LABELS[offering.category]}
              </nav>
              <div className="flex flex-wrap gap-2">
                <span className="store-badge store-badge-solid">{KIND_LABELS[offering.kind]}</span>
                <span className="store-badge store-badge-line">{CATEGORY_LABELS[offering.category]}</span>
                {offering.free ? <span className="store-badge store-badge-line tone-success">Free</span> : null}
              </div>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">{offering.title}</h1>
              <p className="max-w-2xl text-lg text-muted">{offering.summary}</p>
              {offering.rating.count > 0 && offering.rating.average !== null ? (
                <a href="#reviews-heading" className="flex items-center gap-2 text-sm text-muted no-underline" aria-label={ratingLabel(offering.rating.average, offering.rating.count)}>
                  <span className="tone-warning text-lg" aria-hidden="true">
                    {stars(offering.rating.average)}
                  </span>
                  <span aria-hidden="true">
                    {offering.rating.average.toFixed(1)} · {offering.rating.count} {offering.rating.count === 1 ? 'review' : 'reviews'}
                  </span>
                </a>
              ) : null}
              {query.problem && PROBLEMS[query.problem] ? (
                <p role="alert" className="notice notice-error">
                  {PROBLEMS[query.problem]}
                </p>
              ) : null}

              <div className="cut-md grid gap-2 border p-5" style={{ borderColor: `var(${tone})`, background: 'var(--ox-color-surface)' }}>
                <span className="studio-kicker" style={{ color: `var(${tone})` }}>
                  // What&apos;s included
                </span>
                <ul className="grid gap-1.5">
                  {included.map((line) => (
                    <li key={line} className="flex gap-2.5 text-sm">
                      <span className="tone-success" aria-hidden="true">
                        ✓
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              {ip ? <LicenseBox /> : null}
            </div>

            <aside aria-labelledby="plan-heading" className="cut-md grid content-start gap-4 self-start border border-line bg-surface p-6" style={{ boxShadow: `0 0 40px color-mix(in srgb, var(${tone}) 14%, transparent)` }}>
              {access ? (
                <>
                  <h2 id="plan-heading" className="studio-h2">
                    You have access
                  </h2>
                  <p className="text-muted">{access.endsAt ? `Your plan runs until ${formatDate(access.endsAt, 'Asia/Kathmandu')}.` : 'Lifetime access: no end date.'}</p>
                  <Link href={`/w/${access.workspaceSlug}/courses/${offering.id}`} className="btn btn-primary justify-center py-4 font-studio text-lg">
                    Continue learning ▶
                  </Link>
                  {offering.plans.length > 0 ? (
                    <Link href={`/w/${access.workspaceSlug}/courses/${offering.id}#plans`} className="btn btn-secondary justify-center font-studio">
                      Renew or extend
                    </Link>
                  ) : null}
                </>
              ) : offering.plans.length > 0 ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h2 id="plan-heading" className="studio-h2 text-2xl">
                      {ip ? 'Get access' : 'Choose a plan'}
                    </h2>
                    <span className="text-hud text-xs text-muted">NPR · this {KIND_LABELS[offering.kind].toLowerCase()}</span>
                  </div>
                  {offering.checkoutOpen ? null : (
                    <p className="notice" role="status">
                      Payments open very soon. You can already look at the plans{offering.freeLessonCount > 0 ? ' and watch the free lessons' : ''}.
                    </p>
                  )}
                  <PlanPicker offering={offering.slug} courseId={offering.id} plans={offering.plans} initial={initial} tone={tone} />
                  {offering.freeLessonCount > 0 ? <EnterButton offering={offering.slug} courseId={offering.id} label="Watch the free lessons first" secondary /> : null}
                </>
              ) : offering.free ? (
                <>
                  <h2 id="plan-heading" className="studio-h2 text-2xl">
                    Free to learn
                  </h2>
                  <p className="text-muted">No plan needed. Sign in with your email and start.</p>
                  <EnterButton offering={offering.slug} courseId={offering.id} label="Start learning free ▶" />
                </>
              ) : (
                <>
                  <h2 id="plan-heading" className="studio-h2 text-2xl">
                    {formatPrice({ amountMinor: offering.fromMinor, currency: offering.currency })}
                  </h2>
                  <p className="text-muted">Plans for this offering are being prepared. Open it to see the free lessons, or check back soon.</p>
                  <EnterButton offering={offering.slug} courseId={offering.id} label="Open the course" secondary />
                </>
              )}
              {ip && !access ? (
                <p className="border-t border-dashed border-line pt-3 text-sm text-muted">
                  For a company or a product, ask for a commercial license: <a href={`mailto:${SUPPORT}?subject=${encodeURIComponent(`Commercial license: ${offering.title}`)}`}>{SUPPORT}</a>
                </p>
              ) : null}
            </aside>
          </div>
        </section>

        <div className="store-wrap grid gap-10 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-5">
            {offering.description.trim() ? (
              <section aria-labelledby="about-heading" className="grid gap-3">
                <h2 id="about-heading" className="studio-kicker">
                  // About
                </h2>
                <div className="prose-ox">
                  <LessonMarkdown>{offering.description}</LessonMarkdown>
                </div>
              </section>
            ) : null}

            <section aria-labelledby="syllabus-heading" className="grid gap-4">
              <div className="grid gap-1">
                <span className="studio-kicker">// Syllabus · free to read</span>
                <h2 id="syllabus-heading" className="studio-title">
                  {ip ? "What's inside" : 'What you will learn'}
                </h2>
              </div>
              {offering.curriculum.length === 0 ? <p className="text-muted">The syllabus is being written.</p> : null}
              {offering.curriculum.map((section, index) => (
                <div key={`${index}-${section.title}`} className="cut-md border border-line bg-surface">
                  <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                    <h3 className="font-studio text-lg font-bold">
                      {String(index + 1).padStart(2, '0')} · {section.title}
                    </h3>
                    <span className="text-hud text-xs text-muted">
                      {section.lessons.length} item{section.lessons.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <ul>
                    {section.lessons.map((lesson, position) => (
                      <li key={`${position}-${lesson.title}`} className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-dashed border-line px-5 py-2.5 last:border-b-0">
                        <span className={`text-hud text-xs ${lesson.isPreview ? 'tone-success' : 'store-lock'}`} aria-hidden="true">
                          {LESSON_ICONS[lesson.kind] ?? '▣'}
                        </span>
                        <span className={lesson.isPreview ? '' : 'text-muted'}>
                          {lesson.title}
                          {lesson.durationSec ? <span className="ml-2 text-xs text-muted">{formatDuration(lesson.durationSec)}</span> : null}
                        </span>
                        <span className={`studio-status ${lesson.isPreview || offering.free ? 'tone-success' : 'store-lock'}`}>
                          {lesson.isPreview || offering.free ? 'Open · free' : '▒▒ Locked'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </div>

          <div className="grid content-start gap-5">
            {offering.liveSessions.length > 0 ? (
              <section aria-labelledby="live-heading" className="cut-md grid gap-2 border bg-surface p-5" style={{ borderColor: 'var(--ox-color-highlight)' }}>
                <h2 id="live-heading" className="studio-kicker" style={{ color: 'var(--ox-color-highlight)' }}>
                  // Live classes
                </h2>
                <ul className="grid gap-2">
                  {offering.liveSessions.map((session) => (
                    <li key={`${session.startsAt}-${session.title}`} className="grid gap-0.5 border-b border-dashed border-line pb-2 last:border-b-0 last:pb-0">
                      <span className="font-studio text-lg font-bold">{session.title}</span>
                      <span className="text-sm text-muted">
                        <LocalTime iso={session.startsAt} /> · {session.durationMin} min
                      </span>
                      <span className={`studio-status ${session.visibility === 'FREE' ? 'tone-success' : 'store-lock'}`}>
                        {session.visibility === 'FREE' ? 'Free · sign in to join' : 'Subscribers'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {offering.outcomes.length > 0 ? (
              <section aria-labelledby="outcomes-heading" className="cut-md grid gap-2 border border-line bg-surface p-5">
                <h2 id="outcomes-heading" className="studio-kicker" style={{ color: 'var(--ox-color-highlight)' }}>
                  // By the end
                </h2>
                <ul className="grid gap-1.5">
                  {offering.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-2.5 text-sm">
                      <span style={{ color: 'var(--ox-color-highlight)' }} aria-hidden="true">
                        ▸
                      </span>
                      {outcome}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {offering.rating.count > 0 ? <Reviews offering={offering} /> : null}
            <section aria-labelledby="faq-heading" className="grid gap-2">
              <h2 id="faq-heading" className="studio-kicker">
                // Questions
              </h2>
              {faq.map((item) => (
                <details key={item.q} className="store-faq">
                  <summary>{item.q}</summary>
                  <p className="mt-2 text-sm text-muted">{item.a}</p>
                </details>
              ))}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

/** Learner reviews (FR-CATALOG-304; design screen 2): approved reviews only, hidden while there are none. */
function Reviews({ offering }: { offering: StoreOfferingDetail }) {
  const { rating } = offering;
  const shares = starShares(rating.stars);
  return (
    <section aria-labelledby="reviews-heading" className="cut-md grid gap-4 border border-line bg-surface p-5">
      <h2 id="reviews-heading" className="studio-kicker" style={{ color: 'var(--ox-color-warning)' }}>
        // Learner reviews
      </h2>
      <div className="grid items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="grid justify-items-start gap-1">
          <span className="font-display text-4xl font-bold">{rating.average?.toFixed(1)}</span>
          <span className="tone-warning" aria-hidden="true">
            {stars(rating.average ?? 0)}
          </span>
          <span className="text-hud text-xs text-muted">{ratingLabel(rating.average, rating.count)}</span>
        </div>
        <ul className="grid gap-1" aria-label="Reviews by stars">
          {shares.map((share, index) => (
            <li key={index} className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
              <span className="text-hud">{5 - index} ★</span>
              <span className="h-1.5 bg-[var(--ox-color-border)]">
                <span className="block h-full" style={{ width: `${share}%`, background: 'var(--ox-color-warning)' }} />
              </span>
              <span className="text-hud text-muted">{rating.stars[index] ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="grid gap-3">
        {offering.reviews.map((review) => (
          <li key={`${review.author}-${review.createdAt}`} className="grid gap-1 border-t border-line pt-3">
            <span className="flex flex-wrap items-center gap-2 text-sm">
              <span className="tone-warning" aria-label={`${review.rating} out of 5`}>
                {stars(review.rating)}
              </span>
              <span className="font-semibold">{review.author}</span>
              <span className="text-hud text-xs text-muted">{formatDate(review.createdAt, 'Asia/Kathmandu')}</span>
            </span>
            {review.body ? <p className="whitespace-pre-line text-sm text-muted">{review.body}</p> : null}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">Reviews come from learners who joined this offering and are checked by the store before they appear.</p>
    </section>
  );
}

/** Content license for ideas and research (design screen 13). Full license terms follow with ADR-028 step 5. */
function LicenseBox() {
  return (
    <section aria-labelledby="license-heading" className="cut-md grid gap-4 border border-line bg-surface p-5 sm:grid-cols-2">
      <h2 id="license-heading" className="sr-only">
        Content license
      </h2>
      <div className="grid content-start gap-1.5">
        <span className="studio-status tone-success">✓ You may</span>
        <span className="text-sm">· Read and use it for your own learning and decisions</span>
        <span className="text-sm">· Apply the idea in your own project</span>
        <span className="text-sm">· Quote short parts with credit to Oxinov</span>
      </div>
      <div className="grid content-start gap-1.5">
        <span className="studio-status tone-danger">✕ You may not</span>
        <span className="text-sm">· Share, resell, or upload it</span>
        <span className="text-sm">· Pass on your sign-in or the viewer link</span>
        <span className="text-sm">· Use it in a commercial product without a commercial license</span>
      </div>
    </section>
  );
}
