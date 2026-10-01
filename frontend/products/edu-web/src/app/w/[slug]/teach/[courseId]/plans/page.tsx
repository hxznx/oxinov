import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { PlansForm } from './PlansForm';

type Props = { params: Promise<{ slug: string; courseId: string }> };

export const metadata: Metadata = { title: 'Plans and prices' };

/** Access plans of one course (FR-CATALOG-305; design screen 7, "Plans and prices"). The owner edits; administrators read. */
export default async function PlansPage({ params }: Props) {
  const { slug, courseId } = await params;
  const here = `/w/${slug}/teach/${courseId}/plans`;
  const { token, workspace } = await workspaceContext(slug, here);
  if (workspace.role !== 'ADMIN' && workspace.role !== 'OWNER') notFound();
  const [{ plans, defaults }, course] = await Promise.all([
    load(here, () => eduApi.managePlans(token, workspace.id, courseId)),
    load(here, () => eduApi.course(token, workspace.id, courseId)),
  ]);

  return (
    <>
      <EduHeader signedIn workspace={workspace} />
      <main id="main" className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <div>
          <p className="hud-label">
            <Link href={`/w/${slug}/teach/${courseId}`}>// {course.title}</Link>
          </p>
          <h1 className="mt-2 text-4xl">Plans and prices</h1>
          <p className="mt-2 opacity-80">
            Learners choose one plan at checkout and pay by bank QR. Price changes apply to new checkouts only; open checkouts keep the price the learner saw.
          </p>
        </div>
        <PlansForm slug={slug} tenantId={workspace.id} courseId={courseId} plans={plans} defaults={defaults} disabled={workspace.role !== 'OWNER'} />
      </main>
    </>
  );
}
