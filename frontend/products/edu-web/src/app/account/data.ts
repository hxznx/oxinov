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
  const token = session.accessToken;
  const [me, home, workspaces] = await Promise.all([
    load(returnTo, () => eduApi.me(token)),
    eduApi.storeHome().catch(() => null),
    load(returnTo, () => eduApi.workspaces(token)),
  ]);
  const store = home ? { slug: home.slug, name: home.name } : null;
  return { token, me, store, workspace: store ? workspaces.find((item) => item.slug === store.slug) : undefined };
});
