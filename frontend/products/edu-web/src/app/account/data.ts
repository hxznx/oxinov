import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '@/lib/auth.ts';
import { eduApi, type Me, type Workspace } from '@/lib/edu-api.ts';
import { load } from '@/lib/guard.ts';

export interface AccountContext {
  token: string;
  me: Me;
  /** The Oxinov store workspace, when the store exists. */
  store: { slug: string; name: string } | null;
  /** The caller's membership of the store workspace, once they have joined it. */
  workspace: Workspace | undefined;
}

/** The signed-in person, the store, and their place in it; cached per request so layout and page share it. */
export const accountContext = cache(async (returnTo: string): Promise<AccountContext> => {
  const session = await auth.currentSession(returnTo);
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return loadContext(session.accessToken);
});

/**
 * For the layout, which cannot see the page's address: null when signed out, so the page itself redirects
 * to sign-in and comes back to the right section afterwards.
 */
export const optionalAccountContext = cache(async (): Promise<AccountContext | null> => {
  const session = await auth.currentSession('/account');
  return session ? loadContext(session.accessToken) : null;
});

/** One lookup per request for the layout and the page together (keyed by the session token only). */
const loadContext = cache(async (token: string): Promise<AccountContext> => {
  const [me, home, workspaces] = await Promise.all([
    load('/account', () => eduApi.me(token)),
    eduApi.storeHome().catch(() => null),
    load('/account', () => eduApi.workspaces(token)),
  ]);
  const store = home ? { slug: home.slug, name: home.name } : null;
  return { token, me, store, workspace: store ? workspaces.find((item) => item.slug === store.slug) : undefined };
});
