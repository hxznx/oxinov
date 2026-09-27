import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHeader } from '@/components/EduHeader';
import { eduApi } from '@/lib/edu-api.ts';
import { groupCode, linkedInAddUrl } from '@/lib/certificate.ts';
import { formatDate } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { CopyLinkButton, PrintButton, RevokeForm } from './CertificateActions';

type Props = { params: Promise<{ slug: string; code: string }> };

export const metadata: Metadata = { title: 'Certificate' };

const appUrl = () => process.env.APP_URL?.replace(/\/$/, '') ?? 'https://edu.oxinov.com';

/**
 * A learner's certificate (FR-CERT-601): print-quality layout for saving as PDF, a public verification link,
 * and "Add to LinkedIn". School administrators can also revoke it here (FR-CERT-602).
 */
export default async function CertificatePage({ params }: Props) {
  const { slug, code } = await params;
  const here = `/w/${slug}/certificates/${code}`;
  const { token, workspace } = await workspaceContext(slug, here);
  const certificate = await load(here, () => eduApi.certificate(token, workspace.id, code));
  const verifyUrl = `${appUrl()}/verify/${certificate.code}`;
  const linkedIn = linkedInAddUrl({ ...certificate, verifyUrl });
  const isAdmin = workspace.role === 'ADMIN' || workspace.role === 'OWNER';
  const valid = certificate.status === 'VALID';

  return (
    <>
      <div className="print:hidden">
        <EduHeader signedIn workspace={workspace} />
      </div>
      <main id="main" className="mx-auto grid max-w-4xl gap-6 px-4 py-10 print:p-0">
        {!valid ? (
          <p role="alert" className="notice notice-error print:hidden">
            This certificate was revoked on {formatDate(certificate.revokedAt ?? certificate.issuedAt, workspace.timeZone)} and is no longer valid.
          </p>
        ) : null}

        <article
          aria-label="Certificate of completion"
          className="card grid gap-6 border-4 p-10 text-center print:border-2 print:shadow-none"
          style={{ breakInside: 'avoid' }}
        >
          <p className="hud-label">// {certificate.schoolName} · Oxinov Edu</p>
          <h1 className="font-display text-4xl">Certificate of completion</h1>
          <p>This certifies that</p>
          <p className="font-display text-3xl">{certificate.holderName}</p>
          <p>has completed the course</p>
          <p className="font-display text-2xl">{certificate.courseTitle}</p>
          <div className="grid gap-1 sm:grid-cols-2">
            <p>
              <span className="hud-label">Issued</span>
              <br />
              {formatDate(certificate.issuedAt, workspace.timeZone)}
            </p>
            {certificate.instructorName ? (
              <p>
                <span className="hud-label">Instructor</span>
                <br />
                {certificate.instructorName}
              </p>
            ) : null}
          </div>
          <p className="text-sm">
            Certificate ID <code>{groupCode(certificate.code)}</code> · Verify at {verifyUrl}
          </p>
        </article>

        {valid ? (
          <div className="flex flex-wrap gap-3 print:hidden">
            <PrintButton />
            <CopyLinkButton url={verifyUrl} />
            <a href={linkedIn} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
              Add to LinkedIn
            </a>
            <Link href={`/verify/${certificate.code}`} className="btn btn-secondary">
              Public verification page
            </Link>
          </div>
        ) : null}

        {isAdmin && valid ? (
          <div className="print:hidden">
            <RevokeForm tenantId={workspace.id} code={certificate.code} returnTo={here} />
          </div>
        ) : null}
        {isAdmin && certificate.revokeReason ? (
          <p className="notice print:hidden">Revocation reason: {certificate.revokeReason}</p>
        ) : null}
      </main>
    </>
  );
}
