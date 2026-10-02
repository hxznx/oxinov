import { eduApi } from '@/lib/edu-api.ts';
import { load } from '@/lib/guard.ts';
import type { OfferingRow } from '@/lib/studio.ts';

/**
 * Every course in the workspace (drafts too), joined with its sale state, kind, and category. The catalog
 * shows administrators drafts as well, so "published" comes from the course status, not from presence.
 */
export async function loadOfferings(token: string, tenantId: string, returnTo: string): Promise<OfferingRow[]> {
  const [authored, catalog] = await Promise.all([
    load(returnTo, () => eduApi.authoredCourses(token, tenantId)),
    load(returnTo, () => eduApi.courses(token, tenantId, undefined, 50)),
  ]);
  const listed = new Map(catalog.map((course) => [course.id, course]));
  return authored.map((course) => {
    const live = listed.get(course.courseId);
    const published = live?.status === 'PUBLISHED';
    return {
      courseId: course.courseId,
      title: live?.title || course.title,
      published,
      draftStatus: course.draftStatus,
      hasPlans: published && live?.hasPlans === true,
      fromMinor: live && published ? live.price.amountMinor : null,
      kind: live?.kind ?? 'COURSE',
      category: live?.category ?? 'OTHER',
    };
  });
}
