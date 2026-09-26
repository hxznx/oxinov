import type { Question } from '@/content/site';
import { JsonLd, faqSchema } from '@/seo';

/** Visible questions and answers plus the matching FAQPage data, so the two can never differ. */
export function Faq({ questions, title = 'Frequently asked questions' }: { questions: Question[]; title?: string }) {
  return (
    <section aria-labelledby="faq" className="mt-12">
      <JsonLd data={faqSchema(questions)} />
      <h2 id="faq" className="text-2xl">
        {title}
      </h2>
      <dl className="mt-4 grid gap-4">
        {questions.map((item) => (
          <div key={item.question} className="card">
            <dt className="font-semibold">{item.question}</dt>
            <dd className="mt-2 text-muted">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
