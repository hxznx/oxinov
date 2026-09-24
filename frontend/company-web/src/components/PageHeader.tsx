import type { ReactNode } from 'react';

/** Page title block: one h1 per page (FR-SITE-2101 accessibility tests rely on it). */
export function PageHeader({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return (
    <div className="grid-bg border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="hud-label">// {label}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{title}</h1>
        {children ? <div className="mt-4 max-w-3xl text-lg text-muted">{children}</div> : null}
      </div>
    </div>
  );
}
