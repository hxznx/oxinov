import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { PlansForm } from './PlansForm';

type Props = { params: Promise<{ slug: string; courseId: string }> };

export const metadata: Metadata = { title: 'Plans and prices' };

/** Access plans of one offering (FR-CATALOG-305; design screen 7). The owner edits; administrators read. */
export default async function PlansPage({ params }: Props) {
  const { slug, courseId } = await params;
  const here = `/w/${slug}/studio/offerings/${courseId}/plans`;
  const { token, workspace } = await workspaceContext(slug, here);
  const [{ plans, defaults }, course] = await Promise.all([
    load(here, () => eduApi.managePlans(token, workspace.id, courseId)),
    load(here, () => eduApi.course(token, workspace.id, courseId)),
  ]);

  return (
    <div className="grid max-w-3xl gap-5">
      <div className="grid gap-1">
        <span className="studio-kicker">
          <Link href={`/w/${slug}/studio/offerings`}>// Offerings</Link>
        </span>
        <h1 className="studio-title">
          <span className="crumb">{course.title} ›</span> Plans and prices
        </h1>
        <p className="text-sm text-muted">
          Learners choose one plan at checkout and pay by bank QR. Price changes apply to new checkouts only; open checkouts keep the price the learner saw.
        </p>
      </div>
      <PlansForm slug={slug} tenantId={workspace.id} courseId={courseId} plans={plans} defaults={defaults} disabled={workspace.role !== 'OWNER'} />
    </div>
  );
}
