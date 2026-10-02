import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { LocalTime } from '@/components/LocalTime';
import { OfferingCard } from '@/components/OfferingCard';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi, type Enrollment, type StoreHome as StoreHomeData, type Workspace } from '@/lib/edu-api.ts';
import { formatNpr } from '@/lib/store.ts';
import { KINDS, KIND_LABELS, parseKind, storeRails } from '@/lib/storefront.ts';

const SIGN_IN_MESSAGES: Record<string, string> = {
  cancelled: 'Sign-in was cancelled.',
  expired: 'Your sign-in expired. Please try again.',
  failed: 'We could not complete sign-in. Please try again.',
};

const TIERS = ['T1', 'T2', 'T3', 'T∞'];
const TIER_TONES = ['--ox-color-brand', '--ox-color-brand-mid', '--ox-color-brand-2', '--ox-color-highlight'];
const PLAN_NOTES: Record<string, string> = { MONTH_1: 'Full access for a month', MONTH_6: 'Full access, half a year', YEAR_1: 'Full access, 12 months', LIFETIME: 'No end date' };
const TICKER =
  '> CONNECTION SECURE · ACCESS LEVEL: VISITOR · INTRO AND SYLLABUS: OPEN · LESSONS: ENCRYPTED · UNLOCK WITH A PLAN · LIVE CLASSES · ASK OXI WHERE TO START · LANGUAGES · TECHNOLOGY · IDEAS · THINK TANK ·  ';

type Props = { searchParams: Promise<{ signin?: string; kind?: string; q?: string }> };

/**
 * Oxinov store home (ADR-028; design screens 1 and 6): edu.oxinov.com opens on Oxinov's own store. Anyone
 * can browse; signing in adds "continue learning" and the way into Oxinov Studio for administrators.
 */
export default async function StoreHome({ searchParams }: Props) {
  const query = await searchParams;
  const kind = parseKind(query.kind);
  const q = query.q?.trim().slice(0, 100) || undefined;
  const session = await auth.currentSession('/');

  let store: StoreHomeData | null = null;
  try {
    store = await eduApi.storeHome();
  } catch (error) {
    if (!(error instanceof EduApiError && error.status === 404)) throw error;
  }

  // Signed in: where they study in the store, and whether they run it. Failures here never hide the store.
  let membership: Workspace | undefined;
  let continuing: Enrollment[] = [];
  let unread = 0;
  if (session && store) {
    try {
      membership = (await eduApi.workspaces(session.accessToken)).find((workspace) => workspace.slug === store.slug);
      if (membership) {
        const [enrollments, notices] = await Promise.all([
          eduApi.myEnrollments(session.accessToken, membership.id),
          eduApi.myNotifications(session.accessToken, membership.id).catch(() => ({ unread: 0 })),
        ]);
        continuing = enrollments.filter((enrollment) => enrollment.hasAccess).slice(0, 3);
        unread = notices.unread;
      }
    } catch {
      membership = undefined;
    }
  }
  const message = SIGN_IN_MESSAGES[query.signin ?? ''];

  return (
    <>
      <EduHeader signedIn={session !== null} returnTo="/" />
      <main id="main">
        <div className="store-ticker" aria-hidden="true">
          <span className="store-ticker-track">
            {TICKER}
            {TICKER}
          </span>
        </div>

        {unread > 0 ? (
          <div className="store-wrap pt-4">
            <Link href="/account/notifications" className="notice flex items-center justify-between gap-3 no-underline" style={{ borderLeftColor: 'var(--ox-color-brand)' }}>
              <span>
                ✉ You have {unread} new {unread === 1 ? 'notification' : 'notifications'}.
              </span>
              <span className="text-sm">Open ›</span>
            </Link>
          </div>
        ) : null}

        {message ? (
          <div className="store-wrap pt-4">
            <p role="alert" className="notice notice-error">
              {message}
            </p>
          </div>
        ) : null}

        <section className="store-hero grid-bg scanlines">
          <div className="store-wrap relative z-10 grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:py-20">
            <div className="grid gap-5">
              <p className="studio-kicker">
                [ OXINOV://KNOWLEDGE-STORE ]{' '}
                <span className="blink" aria-hidden="true">
                  █
                </span>
              </p>
              <h1 className="store-h1">
                <span className="glitch">Learn the skills.</span>
                <br />
                <span className="text-gradient">Own the ideas.</span>
              </h1>
              <p className="max-w-xl text-lg text-muted">
                Courses, skills, training, ideas and think-tank research from Oxinov. Watch the introduction and syllabus free, then unlock every lesson, book and live
                class with one plan.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#browse" className="btn btn-primary font-studio">
                  ▶ Start mission
                </a>
                <a href="#plans" className="btn btn-secondary font-studio">
                  View access plans
                </a>
                {membership && (membership.role === 'OWNER' || membership.role === 'ADMIN') ? (
                  <Link href={`/w/${membership.slug}/studio`} className="btn btn-secondary font-studio">
                    Oxinov Studio
                  </Link>
                ) : null}
              </div>
              <p className="flex flex-wrap gap-x-5 gap-y-1 text-hud text-xs tracking-widest text-muted">
                <span>
                  <span className="tone-success">●</span> FREE PREVIEW ON EVERY COURSE
                </span>
                <span>
                  <span className="tone-brand">●</span> WATCH ON PHONE OR PC
                </span>
                <span>
                  <span className="tone-pink">●</span> LIVE CLASSES
                </span>
                <span>
                  <span className="tone-warning">●</span> CERTIFICATES
                </span>
              </p>
            </div>

            {store ? (
              <div id="plans" className="brackets hex-bg grid gap-3 border border-line bg-surface p-5">
                <div className="flex items-center justify-between text-hud text-xs tracking-widest">
                  <span className="tone-brand">ACCESS.PLANS // NPR</span>
                  <span className="tone-success">■ ONLINE</span>
                </div>
                {store.defaultPlans.map((plan, index) => (
                  <div key={plan.period} className="cut-sm grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border border-line bg-bg px-3 py-3">
                    <span className="text-hud text-sm" style={{ color: `var(${TIER_TONES[index]})` }}>
                      {TIERS[index]}
                    </span>
                    <span className="grid">
                      <span className="font-studio font-bold">{plan.label}</span>
                      <span className="text-xs text-muted">{PLAN_NOTES[plan.period]}</span>
                    </span>
                    <span className="font-display font-bold" style={{ color: `var(${TIER_TONES[index]})` }}>
                      {formatNpr(plan.priceMinor).replace('NPR ', '')}
                    </span>
                  </div>
                ))}
                <p className="text-hud text-xs tracking-wider text-muted">&gt; STARTING PRICES · EACH OFFERING SHOWS ITS OWN · PAY BY BANK QR · CARD FOR LEARNERS ABROAD: SOON</p>
              </div>
            ) : null}
          </div>
        </section>

        <div className="store-wrap grid gap-10 py-10">
          {continuing.length > 0 && membership ? (
            <section aria-labelledby="continue-heading" className="grid gap-3">
              <h2 id="continue-heading" className="studio-kicker">
                // Continue where you left off
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {continuing.map((enrollment) => (
                  <Link key={enrollment.id} href={`/w/${membership.slug}/courses/${enrollment.courseId}`} className="store-card flex-row items-center gap-3 p-4">
                    <span className="grid flex-1">
                      <span className="font-studio font-bold">{enrollment.courseTitle}</span>
                      <span className="studio-status tone-success">Resume ▶</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {!store ? (
            <section className="card grid gap-3">
              <h2 className="studio-h2">The Oxinov store opens soon</h2>
              <p className="text-muted">Courses, ideas and research will appear here. If your school uses Oxinov Edu, open it from My learning.</p>
              <Link href="/spaces" className="btn btn-primary justify-self-start">
                Go to my learning
              </Link>
            </section>
          ) : (
            <>
              <StoreBrowse store={store} kind={kind} q={q} />
              <LiveClasses store={store} />
              <StartHelp signedIn={session !== null} />
            </>
          )}
        </div>
      </main>
    </>
  );
}

/** The next live classes (design screen 1, "Live class · free to join"): time in the visitor's zone, no link. */
function LiveClasses({ store }: { store: StoreHomeData }) {
  if (store.upcomingLive.length === 0) return null;
  return (
    <section aria-labelledby="live-heading" className="grid gap-3">
      <h2 id="live-heading" className="studio-kicker" style={{ color: 'var(--ox-color-highlight)' }}>
        // Live classes
      </h2>
      <ul className="grid gap-3 md:grid-cols-3">
        {store.upcomingLive.map((session) => (
          <li key={`${session.offeringSlug}-${session.startsAt}`}>
            <Link href={`/o/${session.offeringSlug}`} className="cut-md grid h-full gap-2 border bg-surface p-4 text-inherit no-underline" style={{ borderColor: 'var(--ox-color-highlight)' }}>
              <span className={`studio-status ${session.visibility === 'FREE' ? 'tone-success' : 'tone-muted'}`}>
                {session.visibility === 'FREE' ? '● Free to join' : '● For subscribers'}
              </span>
              <span className="font-studio text-lg font-bold leading-tight">{session.title}</span>
              <span className="text-sm text-muted">
                <LocalTime iso={session.startsAt} /> · {session.durationMin} min
              </span>
              <span className="text-xs text-muted">{session.offeringTitle} · See details ›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Where to start (design screen 1): ask OXI, and invite friends ("Recruit your squad"). */
function StartHelp({ signedIn }: { signedIn: boolean }) {
  return (
    <section aria-label="Getting started" className="grid gap-4 md:grid-cols-2">
      <div className="cut-md grid content-start gap-3 border bg-surface p-5" style={{ borderColor: 'var(--ox-color-success)' }}>
        <span className="studio-kicker" style={{ color: 'var(--ox-color-success)' }}>
          // Not sure where to start?
        </span>
        <h2 className="font-studio text-2xl font-bold">Ask OXI, your course advisor</h2>
        <p className="text-sm text-muted">Tell OXI your goal, like &quot;work in Japan&quot; or &quot;learn programming&quot;, and get picks from this store with free lessons to try first.</p>
        <Link href="/account/messages" className="btn btn-primary justify-self-start font-studio">
          ✦ Ask OXI
        </Link>
      </div>
      <div className="cut-md grid content-start gap-3 border bg-surface p-5" style={{ borderColor: 'var(--ox-color-brand-2)' }}>
        <span className="studio-kicker" style={{ color: 'var(--ox-color-brand-2)' }}>
          // Recruit your squad
        </span>
        <h2 className="font-studio text-2xl font-bold">Learning is better together</h2>
        <p className="text-sm text-muted">Share Oxinov or recommend a course to a friend on WhatsApp, Facebook, Viber or email.</p>
        <Link href={signedIn ? '/account/invite' : '/auth/login?returnTo=%2Faccount%2Finvite'} className="btn btn-secondary justify-self-start font-studio">
          ⇪ Invite friends
        </Link>
      </div>
    </section>
  );
}

function StoreBrowse({ store, kind, q }: { store: StoreHomeData; kind?: (typeof KINDS)[number]; q?: string }) {
  const rails = storeRails(store.offerings, { kind, q });
  const href = (value?: string) => {
    const params = new URLSearchParams();
    if (value) params.set('kind', value);
    if (q) params.set('q', q);
    const text = params.toString();
    return `/${text ? `?${text}` : ''}#browse`;
  };
  return (
    <>
      <section id="browse" aria-labelledby="browse-heading" className="grid gap-4 scroll-mt-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-1">
            <span className="studio-kicker">// Browse</span>
            <h2 id="browse-heading" className="studio-title">
              Choose your path
            </h2>
          </div>
          <form role="search" action="/" className="flex gap-2">
            {kind ? <input type="hidden" name="kind" value={kind} /> : null}
            <label htmlFor="store-q" className="sr-only">
              Search the store
            </label>
            <input id="store-q" name="q" type="search" className="field" placeholder="Search courses, skills, ideas" defaultValue={q} maxLength={100} />
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </form>
        </div>
        <nav aria-label="Filter by kind" className="flex flex-wrap gap-2">
          <Link href={href()} className="store-chip" aria-current={!kind ? 'page' : undefined}>
            All
          </Link>
          {KINDS.map((value) => (
            <Link key={value} href={href(value)} className="store-chip" aria-current={kind === value ? 'page' : undefined}>
              {KIND_LABELS[value]}
            </Link>
          ))}
        </nav>
      </section>

      {rails.length === 0 ? (
        <p className="card text-muted">
          {store.offerings.length === 0 ? 'New offerings are on the way. Check back soon.' : 'Nothing matches. '}
          {store.offerings.length > 0 ? <Link href="/#browse">Show everything</Link> : null}
        </p>
      ) : (
        rails.map((rail) => (
          <section key={rail.key} aria-labelledby={`rail-${rail.key}`} className="grid gap-4" style={{ ['--tone' as string]: `var(${rail.tone})` }}>
            <div className="store-rail-head">
              <span className="store-rail-bar" aria-hidden="true" />
              <h3 id={`rail-${rail.key}`} className="font-studio text-2xl font-bold">
                {rail.title}
              </h3>
              <span className="text-hud text-xs tracking-widest" style={{ color: `var(${rail.tone})` }}>
                {rail.code}
              </span>
            </div>
            <ul className="store-cards">
              {rail.items.map((offering) => (
                <li key={offering.id} className="contents">
                  <OfferingCard offering={offering} tone={rail.key === 'free' ? '--ox-color-success' : undefined} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
