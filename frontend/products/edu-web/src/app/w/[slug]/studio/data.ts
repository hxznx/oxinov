import { eduApi } from '@/lib/edu-api.ts';
import { load } from '@/lib/guard.ts';
import type { OfferingRow } from '@/lib/studio.ts';

/** Every course in the workspace (drafts too), joined with its published price and plans. */
export async function loadOfferings(token: string, tenantId: string, returnTo: string): Promise<OfferingRow[]> {
  const [authored, catalog] = await Promise.all([
    load(returnTo, () => eduApi.authoredCourses(token, tenantId)),
    load(returnTo, () => eduApi.courses(token, tenantId)),
  ]);
  const published = new Map(catalog.map((course) => [course.id, course]));
  return authored.map((course) => {
    const live = published.get(course.courseId);
    return {
      courseId: course.courseId,
      title: live?.title ?? course.title,
      published: live !== undefined,
      draftStatus: course.draftStatus,
      hasPlans: live?.hasPlans === true,
      fromMinor: live ? live.price.amountMinor : null,
    };
  });
}
