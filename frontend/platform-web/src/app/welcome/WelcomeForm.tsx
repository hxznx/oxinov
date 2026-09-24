'use client';

import { useActionState } from 'react';
import { submitWelcome, type WelcomeState } from './actions';

// ISO 3166-1 alpha-2 codes offered first; the platform API validates the format.
const COUNTRIES: [string, string][] = [
  ['NP', 'Nepal'],
  ['IN', 'India'],
  ['JP', 'Japan'],
  ['KR', 'South Korea'],
  ['AU', 'Australia'],
  ['AE', 'United Arab Emirates'],
  ['QA', 'Qatar'],
  ['SA', 'Saudi Arabia'],
  ['MY', 'Malaysia'],
  ['GB', 'United Kingdom'],
  ['US', 'United States'],
  ['CA', 'Canada'],
];

interface Policy {
  policyId: string;
  version: number;
  title: string;
  url: string;
}

export function WelcomeForm({ mode, policies, displayName }: { mode: 'welcome' | 'update'; policies: Policy[]; displayName: string }) {
  const [state, action, pending] = useActionState<WelcomeState, FormData>(submitWelcome, {});

  return (
    <form action={action} className="card mt-6 grid gap-5" noValidate>
      <input type="hidden" name="mode" value={mode} />
      {policies.map((policy) => (
        <input key={policy.policyId} type="hidden" name="policy" value={`${policy.policyId}@${policy.version}`} />
      ))}

      {mode === 'welcome' ? (
        <>
          <div>
            <label htmlFor="displayName" className="field-label">
              Your name
            </label>
            <input id="displayName" name="displayName" className="field" defaultValue={displayName} maxLength={120} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="country" className="field-label">
              Country
            </label>
            <select id="country" name="country" className="field" required defaultValue="NP">
              {COUNTRIES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="age" value="yes" className="mt-1" required />
            <span>I confirm I meet the minimum age to use Oxinov in my country.</span>
          </label>
        </>
      ) : null}

      <fieldset>
        <legend className="field-label">{mode === 'welcome' ? 'Oxinov policies' : 'Updated policies'}</legend>
        <ul className="grid gap-1">
          {policies.map((policy) => (
            <li key={policy.policyId}>
              <a href={policy.url} target="_blank" rel="noreferrer">
                {policy.title}
              </a>{' '}
              <span className="hud-label">v{policy.version}</span>
            </li>
          ))}
        </ul>
        <label className="mt-3 flex items-start gap-3">
          <input type="checkbox" name="agree" value="yes" className="mt-1" required />
          <span>I have read and agree to these policies.</span>
        </label>
      </fieldset>

      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary justify-center" disabled={pending}>
        {pending ? 'Saving…' : 'Agree and continue'}
      </button>
    </form>
  );
}
