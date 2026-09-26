import type { Question } from '@/content/site';

/**
 * Questions and answers that are shown on the same page (never hidden or extra ones). Google limits FAQ rich
 * results to a few kinds of sites, but Bing and AI answer engines still read this data.
 */
export function faqSchema(questions: Question[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
