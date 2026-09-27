import type { Metadata } from 'next';
import { EduHeader } from '@/components/EduHeader';
import { auth } from '@/lib/auth.ts';
import { groupCode } from '@/lib/certificate.ts';
import { EduApiError, eduApi, type CertificateVerification } from '@/lib/edu-api.ts';

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: 'Verify a certificate' };

/**
 * Public certificate verification (FR-CERT-602), for employers and LinkedIn visitors: no sign-in, and only
 * the holder's name, the course, the school, the issue date, and whether it is valid. Unknown or malformed IDs
 * get the same answer, and nothing about any account.
 */
export default async function VerifyPage({ params }: Props) {
  const { code } = await params;
  const session = await auth.currentSession(`/verify/${code}`).catch(() => null);
  let certificate: CertificateVerification | null = null;
  try {
    certificate = await eduApi.verifyCertificate(code);
  } catch (error) {
    if (!(error instanceof EduApiError && error.status === 404)) throw error;
  }
  const valid = certificate?.status === 'VALID';

  return (
    <>
      <EduHeader signedIn={Boolean(session)} />
      <main id="main" className="mx-auto grid max-w-xl gap-5 px-4 py-10">
        <h1 className="text-3xl">Certificate verification</h1>
        {certificate ? (
          <section className="card grid gap-3" aria-label="Verification result">
            <p role="status" className={valid ? 'notice' : 'notice notice-error'}>
              {valid ? 'This certificate is valid.' : 'This certificate has been revoked and is no longer valid.'}
            </p>
            <dl className="grid gap-2">
              <div>
                <dt className="hud-label">Awarded to</dt>
                <dd className="text-xl">{certificate.holderName}</dd>
              </div>
              <div>
                <dt className="hud-label">Course</dt>
                <dd>{certificate.courseTitle}</dd>
              </div>
              <div>
                <dt className="hud-label">Issued by</dt>
                <dd>{certificate.schoolName} on Oxinov Edu</dd>
              </div>
              <div>
                <dt className="hud-label">Issued on</dt>
                <dd>{new Date(certificate.issuedAt).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</dd>
              </div>
              <div>
                <dt className="hud-label">Certificate ID</dt>
                <dd>
                  <code>{groupCode(certificate.code)}</code>
                </dd>
              </div>
            </dl>
          </section>
        ) : (
          <p role="status" className="notice notice-error">
            No certificate matches this ID. Check that it was copied completely.
          </p>
        )}
      </main>
    </>
  );
}
