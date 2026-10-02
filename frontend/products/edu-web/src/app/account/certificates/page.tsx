import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDate } from '@/lib/format.ts';
import { load } from '@/lib/guard.ts';
import { accountContext } from '../data';

export const metadata: Metadata = { title: 'Certificates' };

/** The learner's certificates, each with a public verification link (FR-AUTH-104, FR-CERT-602). */
export default async function CertificatesPage() {
  const { token, workspace } = await accountContext('/account/certificates');
  const certificates = workspace ? await load('/account/certificates', () => eduApi.myCertificates(token, workspace.id)) : [];

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// My learning</span>
        <h1 className="studio-title">
          <span className="crumb">Account ›</span> Certificates
        </h1>
        <p className="text-sm text-muted">Finish every required lesson, quiz, and assignment of a course to earn its certificate. Anyone can check it with its verification link.</p>
      </div>
      {certificates.length === 0 || !workspace ? (
        <p className="studio-panel px-5 py-4 text-muted">No certificates yet. Your first one appears here when you finish a course.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {certificates.map((certificate) => (
            <li key={certificate.id} className="studio-panel grid gap-3 p-4">
              <div className="cut-sm grid-bg grid aspect-[16/9] place-content-center gap-1 border border-line bg-bg p-4 text-center">
                <span className="text-hud text-[0.625rem] tracking-[0.14em] tone-brand">OXINOV // CERTIFICATE OF COMPLETION</span>
                <span className="font-display text-lg font-bold">{certificate.courseTitle}</span>
                <span className="text-xs text-muted">
                  {certificate.holderName} · {formatDate(certificate.issuedAt, 'Asia/Kathmandu')}
                </span>
              </div>
              <span className={`studio-status ${certificate.status === 'VALID' ? 'tone-success' : 'tone-danger'}`}>
                {certificate.status === 'VALID' ? '✓ Valid' : 'Revoked'} · {certificate.code}
              </span>
              <span className="flex flex-wrap gap-2">
                <Link href={`/w/${workspace.slug}/certificates/${certificate.code}`} className="btn btn-primary text-sm">
                  View and print
                </Link>
                <Link href={`/verify/${certificate.code}`} className="btn btn-secondary text-sm">
                  Verification link
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
