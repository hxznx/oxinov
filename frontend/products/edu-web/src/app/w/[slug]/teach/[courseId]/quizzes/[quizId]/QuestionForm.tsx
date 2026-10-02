'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import type { FormState } from '@/app/actions';
import { saveQuestion } from '@/app/quiz-actions';
import type { QuestionType, QuizQuestion } from '@/lib/edu-api.ts';
import { QUESTION_TYPES } from '@/lib/quiz.ts';

type Props = {
  hidden: Record<string, string>;
  /** Present when editing; absent when adding a new question to a section. */
  question?: QuizQuestion;
  onDone?: () => void;
};

export function QuestionForm({ hidden, question, onDone }: Props) {
  const [type, setType] = useState<QuestionType>(question?.type ?? 'SINGLE_CHOICE');
  const initialChoices = question && question.choices.length > 0 && question.type !== 'TRUE_FALSE' ? question.choices.map((c) => c.text) : ['', '', '', ''];
  const [choices, setChoices] = useState<string[]>(initialChoices);
  const correctIds = new Set(question?.answerKey ?? []);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const [state, action, pending] = useActionState<FormState & { saved?: boolean }, FormData>(async (previous, form) => {
    const result = await saveQuestion(previous, form);
    if (result.saved && !question) {
      // Clear the form for the next new question.
      setChoices(['', '', '', '']);
      setFormKey((key) => key + 1);
    }
    if (result.saved) {
      // Drop an earlier error message carried in the address; keep the selected question.
      const params = new URLSearchParams(window.location.search);
      if (params.has('error')) {
        params.delete('error');
        router.replace(params.size > 0 ? `${pathname}?${params}` : pathname, { scroll: false });
      }
      onDone?.();
    }
    return result;
  }, {});

  const multiple = type === 'MULTIPLE_CHOICE';
  const id = (name: string) => `${question?.id ?? hidden.sectionId}-${name}`;

  return (
    <form key={formKey} action={action} className="grid gap-4" noValidate>
      {Object.entries({ ...hidden, ...(question ? { questionId: question.id } : {}) }).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div>
        <label htmlFor={id('type')} className="field-label">
          Question type
        </label>
        <select id={id('type')} name="type" className="field" value={type} onChange={(event) => setType(event.target.value as QuestionType)}>
          {QUESTION_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={id('prompt')} className="field-label">
          Question
        </label>
        <textarea id={id('prompt')} name="prompt" className="field min-h-20 text-lg" defaultValue={question?.prompt} maxLength={2000} required />
      </div>
      <details open={Boolean(question?.passage)}>
        <summary className="cursor-pointer text-sm text-muted">Reading passage (optional)</summary>
        <textarea name="passage" aria-label="Reading passage" className="field mt-2 min-h-20" defaultValue={question?.passage ?? ''} maxLength={5000} />
      </details>

      {type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' ? (
        <fieldset className="grid gap-2">
          <legend className="field-label">Choices · mark {multiple ? 'every correct choice' : 'the correct choice'}</legend>
          {choices.map((text, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type={multiple ? 'checkbox' : 'radio'}
                className="h-5 w-5 shrink-0 accent-[var(--ox-color-success)]"
                name="correct"
                value={index}
                defaultChecked={question ? correctIds.has(question.choices[index]?.id ?? '') : false}
                aria-label={`Choice ${index + 1} is correct`}
              />
              <input
                name="choice"
                className="field flex-1 text-lg"
                value={text}
                maxLength={500}
                placeholder={`Choice ${index + 1}`}
                aria-label={`Choice ${index + 1}`}
                onChange={(event) => setChoices((list) => list.map((item, i) => (i === index ? event.target.value : item)))}
              />
            </div>
          ))}
          {choices.length < 8 ? (
            <button type="button" className="btn btn-secondary justify-self-start text-sm" onClick={() => setChoices((list) => [...list, ''])}>
              Add a choice
            </button>
          ) : null}
          <p className="text-sm text-muted">Empty rows are ignored.</p>
        </fieldset>
      ) : null}

      {type === 'TRUE_FALSE' ? (
        <fieldset className="flex gap-6">
          <legend className="field-label">The statement is</legend>
          {(['true', 'false'] as const).map((value) => (
            <label key={value} className="flex items-center gap-2">
              <input type="radio" name="answer" value={value} defaultChecked={question?.type === 'TRUE_FALSE' && question.answerKey[0] === value} />
              {value === 'true' ? 'True' : 'False'}
            </label>
          ))}
        </fieldset>
      ) : null}

      {type === 'FILL_BLANK' ? (
        <div>
          <label htmlFor={id('accepted')} className="field-label">
            Accepted answers <span className="text-muted">(one per line)</span>
          </label>
          <textarea
            id={id('accepted')}
            name="accepted"
            className="field min-h-20"
            defaultValue={question?.type === 'FILL_BLANK' ? question.answerKey.join('\n') : ''}
            placeholder={'mizu\nみず'}
          />
          <p className="mt-1 text-sm text-muted">Case, extra spaces, and full-width characters are ignored when marking.</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <div>
          <label htmlFor={id('explanation')} className="field-label">
            Explanation <span className="text-muted">(shown after submitting)</span>
          </label>
          <textarea id={id('explanation')} name="explanation" className="field min-h-16" defaultValue={question?.explanation ?? ''} maxLength={2000} />
        </div>
        <div>
          <label htmlFor={id('marks')} className="field-label">
            Marks
          </label>
          <input id={id('marks')} name="marks" type="number" min={1} max={10} defaultValue={question?.marks ?? 1} className="field" />
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="notice notice-error">
          {state.error}
        </p>
      ) : state.saved ? (
        <p role="status" className="notice">
          {question ? 'Question updated.' : 'Question added.'}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary justify-self-end font-studio" disabled={pending}>
        {pending ? 'Saving…' : question ? 'Save question' : 'Add question'}
      </button>
    </form>
  );
}
