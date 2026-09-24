import { redirect } from 'next/navigation';
import { AccountHeader } from '@/components/AccountHeader';
import { currentSession } from '@/lib/current-session.ts';
import { PlatformApiError, platformApi, type Account, type Entitlement, type Product } from '@/lib/platform-api.ts';

const SIGN_IN_MESSAGES: Record<string, string> = {
  cancelled: 'Sign-in was cancelled.',
  expired: 'Your sign-in expired. Please try again.',
  failed: 'We could not complete sign-in. Please try again.',
};

const TRUST_LABEL: Record<Account['trustLevel'], string> = {
  T1: 'Member · email verified',
  T2: 'Phone verified',
  T3: 'Identity verified',
  T4: 'Business verified',
};

type Props = { searchParams: Promise<{ signin?: string }> };

export default async function AccountHome({ searchParams }: Props) {
  const session = await currentSession('/');
  if (!session) return <SignedOut message={SIGN_IN_MESSAGES[(await searchParams).signin ?? '']} />;

  let account: Account;
  try {
    account = await platformApi.me(session.accessToken);
  } catch (error) {
    // A token the API rejects (revoked session, rotated keys) means signing in again.
    if (error instanceof PlatformApiError && error.status === 401) redirect('/auth/login');
    throw error;
  }
  if (account.welcomeRequired || account.outstandingPolicies.length > 0) redirect('/welcome');

  const [products, entitlements]: [Product[], Entitlement[]] = await Promise.all([
    platformApi.products(),
    platformApi.entitlements(session.accessToken),
  ]);
  const entitled = new Set(entitlements.map((entitlement) => entitlement.productKey));
  const myProducts = products.filter((product) => entitled.has(product.key));

  return (
    <>
      <AccountHeader products={myProducts} signedIn />
      <main id="main" className="mx-auto grid max-w-5xl gap-6 px-4 py-10">
        <div>
          <p className="hud-label">// Oxinov account</p>
          <h1 className="mt-2 text-4xl">Welcome, {account.displayName ?? account.email}</h1>
          <p className="mt-2 text-muted">One account for every Oxinov product.</p>
        </div>

        <section aria-labelledby="apps-heading" className="card">
          <h2 id="apps-heading" className="text-2xl">
            Your apps
          </h2>
          {myProducts.length === 0 ? (
            <p className="mt-2 text-muted">No Oxinov products are open yet. They will appear here as they launch.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {myProducts.map((product) => (
                <li key={product.key}>
                  <a
                    href={`https://${product.address}`}
                    className="card card-link"
                    style={{ borderColor: `var(--ox-color-product-${product.key})` }}
                  >
                    <span className="text-xl" style={{ color: `var(--ox-color-product-${product.key})` }}>
                      {product.name}
                    </span>
                    <span className="hud-label mt-1 block">// Free member access</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section aria-labelledby="plan-heading" className="card">
            <h2 id="plan-heading" className="text-2xl">
              Plan
            </h2>
            <p className="mt-2 font-display text-xl">Free</p>
            <p className="mt-1 text-muted">Oxinov One plans open with the first product launch.</p>
          </section>
          <section aria-labelledby="verify-heading" className="card">
            <h2 id="verify-heading" className="text-2xl">
              Verification
            </h2>
            <p className="mt-2">{TRUST_LABEL[account.trustLevel]}</p>
            <p className="mt-1 text-muted">Phone verification, needed for messaging and orders, arrives next.</p>
          </section>
        </div>

        <section aria-labelledby="profile-heading" className="card">
          <h2 id="profile-heading" className="text-2xl">
            Profile
          </h2>
          <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
            <dt className="hud-label pt-1">Email</dt>
            <dd>{account.email}</dd>
            <dt className="hud-label pt-1">Name</dt>
            <dd>{account.displayName ?? 'Not set'}</dd>
            <dt className="hud-label pt-1">Country</dt>
            <dd>{account.country}</dd>
          </dl>
        </section>
      </main>
    </>
  );
}

function SignedOut({ message }: { message?: string }) {
  const googleEnabled = process.env.GOOGLE_SIGNIN_ENABLED === 'true';
  return (
    <>
      <AccountHeader signedIn={false} />
      <main id="main" className="grid-bg scanlines min-h-[80vh]">
        <div className="relative z-10 mx-auto max-w-md px-4 py-20 text-center">
          <img src="/brand/oxinov-symbol-glow.svg" alt="" width={88} height={88} className="logo-dark mx-auto mb-6" />
          <p className="hud-label">// One account. Every product.</p>
          <h1 className="mt-2 font-display text-3xl">
            <span className="text-gradient">Sign in to Oxinov</span>
          </h1>
          {message ? (
            <p role="alert" className="notice notice-error mt-6 text-left">
              {message}
            </p>
          ) : null}
          <div className="mt-8 grid gap-3">
            {googleEnabled ? (
              <a href="/auth/login?idp=google" className="btn btn-secondary justify-center">
                Continue with Google
              </a>
            ) : null}
            <a href="/auth/login" className="btn btn-primary justify-center">
              Continue with email
            </a>
          </div>
          <p className="mt-6 text-sm text-muted">No password needed. We send a six-digit code to your email.</p>
        </div>
      </main>
    </>
  );
}
