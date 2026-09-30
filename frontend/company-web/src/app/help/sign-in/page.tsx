import type { Metadata } from 'next';
import { Faq } from '@/components/Faq';
import { PageHeader } from '@/components/PageHeader';
import { company, signInHelp, signInUrl, signUpUrl } from '@/content/site';
import { pageMetadata } from '@/seo';

export const metadata: Metadata = pageMetadata({
  path: '/help/sign-in/',
  title: 'Sign-in help',
  description:
    'Help signing in to Oxinov: no password needed, what to do when the email code does not arrive or has expired, and how to get back into your account.',
});

/** Linked as "Trouble signing in?" from every id.oxinov.com page; replaces "forgot password" (FR-ID-2204). */
export default function SignInHelpPage() {
  return (
    <>
      <PageHeader label="Help" title="Trouble signing in?">
        {signInHelp.intro}
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap gap-3">
          <a href={signInUrl} className="btn btn-primary">
            Sign in
          </a>
          <a href={signUpUrl} className="btn btn-secondary">
            Create an account
          </a>
        </div>
        <Faq questions={signInHelp.questions} title="Common problems" />
        {company.email ? (
          <p className="mt-10 text-muted">
            Still stuck? Email <a href={`mailto:${company.email}`}>{company.email}</a> and tell us what you see on
            the screen. Never send us a sign-in code.
          </p>
        ) : null}
      </div>
    </>
  );
}
