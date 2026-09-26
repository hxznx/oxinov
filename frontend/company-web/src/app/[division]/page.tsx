import type { Metadata } from 'next';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { divisions } from '@/content/site';

// Division pages live at oxinov.com/<slug> (see docs/company/PLATFORM-BLUEPRINT.md).
export const dynamicParams = false;

export function generateStaticParams() {
  return divisions.map((division) => ({ division: division.slug }));
}

type Props = { params: Promise<{ division: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { division: slug } = await params;
  const division = divisions.find((item) => item.slug === slug);
  return division
    ? pageMetadata({
        path: `/${division.slug}/`,
        title: division.name,
        description: `${division.tagline} See what ${division.name} plans to build and its current status.`,
      })
    : {};
}

export default async function DivisionPage({ params }: Props) {
  const { division: slug } = await params;
  const division = divisions.find((item) => item.slug === slug);
  if (!division) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Divisions', path: '/divisions/' },
          { name: division.name, path: `/${division.slug}/` },
        ])}
      />
      <PageHeader label="Division" title={division.name}>
        {division.tagline}
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <StatusBadge status={division.status} regulated={division.regulated} />
        <p className="mt-4 max-w-3xl text-lg">{division.description}</p>
        <h2 className="mt-10 text-2xl">Focus areas</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {division.focus.map((area) => (
            <li key={area} className="card">
              {area}
            </li>
          ))}
        </ul>
        <p className="mt-10">
          <Link href="/divisions/">All divisions</Link>
        </p>
      </div>
    </>
  );
}
