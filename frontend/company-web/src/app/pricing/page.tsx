import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { plans } from '@/content/site';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'One Oxinov plan ladder across every product: Free, Plus, Pro, Business, and Enterprise.',
};

export default function PricingPage() {
  return (
    <>
      <PageHeader label="Pricing" title="One plan ladder for every product">
        Oxinov One will upgrade every launched product with one subscription. Prices in NPR will be published when the
        first product opens.
      </PageHeader>
      <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        {plans.map((plan) => (
          <li key={plan.name} className="card">
            <h2 className="font-display text-xl">{plan.name}</h2>
            <p className="hud-label mt-1">{plan.audience}</p>
            <p className="mt-3 text-muted">{plan.summary}</p>
            <p className="hud-label mt-4">// Price announced at launch</p>
          </li>
        ))}
      </ul>
    </>
  );
}
