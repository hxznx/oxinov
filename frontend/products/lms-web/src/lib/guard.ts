import { notFound, redirect } from 'next/navigation';
import { auth } from './auth.ts';
import { EduApiError, eduApi, type Workspace } from './edu-api.ts';

/**
 * Runs an Edu API call for a page. A rejected token signs the person in again; a missing resource
 * (including a workspace they do not belong to, which the API reports as 404) shows the not-found page,
 * and locked content redirects to `onNotEntitled` when given.
 */
export async function load<T>(returnTo: string, call: () => Promise<T>, onNotEntitled?: string): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (error instanceof EduApiError && error.status === 401) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    if (error instanceof EduApiError && error.status === 404) notFound();
    // Locked content: send the person to a page that explains how to get access.
    if (error instanceof EduApiError && error.code === 'NOT_ENTITLED' && onNotEntitled) redirect(onNotEntitled);
    throw error;
  }
}

/** Signed-in person's token plus the workspace named in the address, resolved from their memberships. */
export async function workspaceContext(slug: string, returnTo: string): Promise<{ token: string; workspace: Workspace }> {
  const { accessToken: token } = await auth.requireSession(returnTo);
  const workspaces = await load(returnTo, () => eduApi.workspaces(token));
  const workspace = workspaces.find((item) => item.slug === slug);
  if (!workspace) notFound();
  return { token, workspace };
}
