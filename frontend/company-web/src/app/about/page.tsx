import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { about } from '@/content/site';

export const metadata: Metadata = {
  title: 'About',
  description: 'Oxinov Pvt. Ltd. is a technology company in Lalitpur, Nepal, building one tested product at a time.',
};

export default function AboutPage() {
  return (
    <>
      <PageHeader label="About" title="About Oxinov" />
      <div className="prose-ox mx-auto max-w-6xl px-4 py-12">
        {about.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="card">
            <h2 className="text-2xl">Mission</h2>
            <p className="mt-2 text-muted">{about.mission}</p>
          </section>
          <section className="card">
            <h2 className="text-2xl">Vision</h2>
            <p className="mt-2 text-muted">{about.vision}</p>
          </section>
        </div>
      </div>
    </>
  );
}
