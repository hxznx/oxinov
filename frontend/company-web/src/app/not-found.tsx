import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';

export default function NotFound() {
  return (
    <>
      <PageHeader label="Error 404" title="Page not found">
        This address does not exist on oxinov.com.
      </PageHeader>
      <p className="mx-auto max-w-6xl px-4 py-12">
        <Link href="/" className="btn btn-primary">
          Go to the home page
        </Link>
      </p>
    </>
  );
}
