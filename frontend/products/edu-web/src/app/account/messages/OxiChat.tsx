'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { askOxi, handToSupport } from '@/app/message-actions';
import type { OxiAnswer } from '@/lib/edu-api.ts';
import { OXI_CHIPS, OXI_WELCOME } from '@/lib/messages.ts';
import { KIND_LABELS } from '@/lib/storefront.ts';

type Line = { from: 'me' | 'oxi'; text: string; picks?: OxiAnswer['picks']; handoff?: boolean };

/**
 * OXI, the rule-based course advisor (FR-AI-1705; design screen 15). The conversation lives only in this
 * page; OXI suggests from the store's published offerings, and "Talk to a human" passes the last question to
 * Oxinov support.
 */
export function OxiChat({ tenantId }: { tenantId: string | null }) {
  const [lines, setLines] = useState<Line[]>([{ from: 'oxi', text: OXI_WELCOME }]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const lastQuestion = [...lines].reverse().find((line) => line.from === 'me')?.text ?? '';

  function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    setError('');
    setDraft('');
    setLines((list) => [...list, { from: 'me', text }]);
    start(async () => {
      const result = await askOxi(text);
      if (result.answer) {
        const answer = result.answer;
        setLines((list) => [...list, { from: 'oxi', text: answer.reply, picks: answer.picks, handoff: answer.handoff }]);
      } else setError(result.error ?? 'OXI is unavailable. Try again shortly.');
      requestAnimationFrame(() => end.current?.scrollIntoView({ block: 'end' }));
    });
  }

  function human() {
    if (!tenantId) return;
    start(async () => {
      const result = await handToSupport(tenantId, lastQuestion);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <div className="msg-thread grid-bg" aria-live="polite">
        {lines.map((line, index) => (
          <div key={index} className={`msg ${line.from === 'me' ? 'msg-me' : 'msg-them'}`}>
            <span className="msg-label" style={{ color: line.from === 'me' ? 'var(--ox-color-brand)' : 'var(--ox-color-success)' }}>
              {line.from === 'me' ? 'YOU' : 'OXI'}
            </span>
            <span className="whitespace-pre-line text-sm leading-relaxed">{line.text}</span>
            {line.picks && line.picks.length > 0 ? (
              <span className="grid gap-2 sm:grid-cols-3">
                {line.picks.map((item) => (
                  <Link key={item.slug} href={`/o/${item.slug}`} className="cut-sm grid gap-1 border border-line bg-surface p-3 text-inherit no-underline">
                    <span className="text-hud text-[0.625rem] tone-brand">{KIND_LABELS[item.kind] ?? item.kind}</span>
                    <span className="font-studio font-bold leading-tight">{item.title}</span>
                    <span className="text-xs text-muted">{item.why}</span>
                  </Link>
                ))}
              </span>
            ) : null}
            {line.handoff && tenantId ? (
              <button type="button" className="btn btn-primary justify-self-start px-3 py-1 text-sm" onClick={human} disabled={pending}>
                Talk to a human
              </button>
            ) : null}
          </div>
        ))}
        {pending ? <span className="text-hud text-xs text-muted">OXI is thinking…</span> : null}
        <div ref={end} />
      </div>
      <div className="msg-compose">
        <div className="flex flex-wrap gap-2">
          {OXI_CHIPS.map((chip) => (
            <button key={chip} type="button" className="btn btn-secondary px-3 py-1 text-sm" style={{ color: 'var(--ox-color-success)' }} onClick={() => ask(chip)} disabled={pending}>
              {chip}
            </button>
          ))}
          {tenantId ? (
            <button type="button" className="btn btn-secondary px-3 py-1 text-sm" onClick={human} disabled={pending}>
              Talk to a human
            </button>
          ) : null}
        </div>
        <form
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            ask(draft);
          }}
        >
          <label htmlFor="oxi-question" className="sr-only">
            Ask OXI
          </label>
          <textarea
            id="oxi-question"
            rows={2}
            className="field resize-none"
            value={draft}
            maxLength={500}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                ask(draft);
              }
            }}
            placeholder="Ask OXI about courses, skills, or ideas…"
          />
          <button type="submit" className="btn btn-primary font-studio" disabled={pending || !draft.trim()}>
            Send ›
          </button>
        </form>
        {error ? (
          <p role="alert" className="text-sm tone-danger">
            {error}
          </p>
        ) : null}
        <p className="text-xs text-muted">
          OXI suggests from the Oxinov store only and can make mistakes. It is a simple advisor (no AI yet), never sees your payment details, and keeps no record of
          this chat. &quot;Talk to a human&quot; passes your question to Oxinov support.
        </p>
      </div>
    </>
  );
}
