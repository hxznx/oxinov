'use client';

import { useActionState, useState } from 'react';
import type { FormState } from '@/app/actions';
import { saveLesson } from '@/app/teach-actions';
import { LessonMarkdown } from '@/components/LessonMarkdown';
import type { DraftLesson } from '@/lib/edu-api.ts';

const STARTER = `# Lesson title

Explain one idea at a time.

## Example

| Japanese | Reading | Meaning |
| --- | --- | --- |
| 水 | みず | water |

- Keep sentences short.
- Use \`code\` for commands in IT lessons.
`;

export function LessonEditor({ hidden, lesson }: { hidden: Record<string, string>; lesson: DraftLesson }) {
  const [body, setBody] = useState(lesson.bodyMarkdown);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(async (previous, form) => {
    const result = await saveLesson(previous, form);
    return { ...result, saved: !result.error };
  }, {});

  return (
    <form action={action} className="grid gap-5" noValidate>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div>
        <label htmlFor="title" className="field-label">
          Lesson title
        </label>
        <input id="title" name="title" className="field" defaultValue={lesson.title} maxLength={200} required />
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="field-label mb-0">Lesson text</span>
          <div role="tablist" aria-label="Lesson text view" className="flex gap-2">
            {(['write', 'preview'] as const).map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={tab === name}
                className={`btn text-sm ${tab === name ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTab(name)}
              >
                {name === 'write' ? 'Write' : 'Preview'}
              </button>
            ))}
          </div>
        </div>
        <textarea
          name="bodyMarkdown"
          aria-label="Lesson text in Markdown"
          className={`field min-h-96 font-mono text-sm ${tab === 'write' ? '' : 'hidden'}`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={100_000}
          placeholder={STARTER}
        />
        {tab === 'preview' ? (
          <div className="prose-ox card min-h-96">{body.trim() ? <LessonMarkdown>{body}</LessonMarkdown> : <p className="text-muted">Nothing to preview yet.</p>}</div>
        ) : null}
        <p className="text-sm text-muted">
          Formatting: <code># Heading</code>, <code>**bold**</code>, <code>- list</code>, tables with <code>|</code>, and <code>`code`</code>. Japanese,
          Nepali, and other scripts work as typed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPreview" defaultChecked={lesson.isPreview} />
          Free preview (anyone in the space can open it)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isRequired" defaultChecked={lesson.isRequired} />
          Required to complete the course
        </label>
        <div>
          <label htmlFor="minutes" className="field-label">
            Reading time (minutes)
          </label>
          <input
            id="minutes"
            name="minutes"
            type="number"
            min={0}
            max={1440}
            className="field"
            defaultValue={lesson.durationSec ? Math.round(lesson.durationSec / 60) : ''}
          />
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="notice">
          Lesson saved to the draft.
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? 'Saving…' : 'Save lesson'}
      </button>
    </form>
  );
}
