import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { formatDuration } from '@/lib/format.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { KIND_LABEL, LIBRARY_FILTERS, filterLibrary, formatBytes, itemName, libraryCounts, parseLibraryFilter } from '@/lib/media-library.ts';
import { CopyLink } from './CopyLink';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ show?: string; q?: string }> };

export const metadata: Metadata = { title: 'Media library' };

const KIND_TONE = { YOUTUBE: 'tone-danger', GOOGLE_DRIVE: 'tone-success', UPLOAD: 'tone-mid' } as const;
const KIND_GLYPH = { YOUTUBE: '▶', GOOGLE_DRIVE: '▤', UPLOAD: '▣' } as const;
const STATUS_LABEL = { UPLOADING: 'Uploading', READY: 'Ready', FAILED: 'Failed' } as const;

/**
 * Media library (FR-COURSE-210; design screen 9): every YouTube video, Google Drive file, and upload used
 * by the offerings, with the lessons that use each one. Links can be copied into another lesson; uploads
 * are reused from the lesson editor.
 */
export default async function MediaLibraryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const filter = parseLibraryFilter(query.show);
  const search = (query.q ?? '').slice(0, 100);
  const here = `/w/${slug}/studio/media`;
  const { token, workspace } = await workspaceContext(slug, here);
  const all = await load(here, () => eduApi.mediaLibrary(token, workspace.id));
  const counts = libraryCounts(all);
  const items = filterLibrary(all, filter, search);
  const href = (show: string) => `${here}?show=${show}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
  const lessonHref = (courseId: string, lessonId: string, draft: boolean) =>
    draft ? `/w/${slug}/teach/${courseId}/lessons/${lessonId}` : `/w/${slug}/teach/${courseId}`;

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// Content</span>
        <h1 className="studio-title">Media library</h1>
        <p className="text-sm text-muted">
          Every YouTube video, Google Drive file, and upload in your offerings, and where each is used. To reuse a link, copy it into another lesson; to reuse an
          upload, choose it in the lesson editor.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Media types" className="flex flex-wrap gap-2">
          {LIBRARY_FILTERS.map((item) => (
            <Link
              key={item.value}
              href={href(item.value)}
              aria-current={item.value === filter ? 'page' : undefined}
              className={`btn font-studio ${item.value === filter ? 'btn-primary' : 'btn-secondary'}`}
            >
              {item.label} <span className="text-hud text-xs">{counts[item.value]}</span>
            </Link>
          ))}
        </nav>
        <form action={here} className="flex gap-2" role="search">
          <input type="hidden" name="show" value={filter} />
          <label htmlFor="library-search" className="sr-only">
            Search lessons, offerings, and files
          </label>
          <input id="library-search" name="q" type="search" className="field py-1.5 text-sm" defaultValue={search} placeholder="Search lessons or files" maxLength={100} />
          <button type="submit" className="btn btn-secondary px-3 py-1.5 text-sm">
            Search
          </button>
        </form>
      </div>

      <section aria-labelledby="library-heading" className="studio-panel overflow-x-auto">
        <div className="studio-panel-head">
          <h2 id="library-heading" className="studio-h2">
            {LIBRARY_FILTERS.find((item) => item.value === filter)?.label}
          </h2>
          <span className="studio-status tone-muted">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-4 text-muted">
            {all.length === 0 ? 'Nothing yet. Add a YouTube or Google Drive link, or upload a file, in the course builder.' : 'Nothing matches.'}
          </p>
        ) : (
          <table className="studio-table min-w-[52rem]">
            <thead>
              <tr>
                <th>Item</th>
                <th>Used in</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.kind}:${item.id}`}>
                  <td className="max-w-[20rem]">
                    <span className="flex items-start gap-3">
                      <span className={`studio-icon text-hud ${KIND_TONE[item.kind]}`} aria-hidden="true">
                        {KIND_GLYPH[item.kind]}
                      </span>
                      <span className="grid min-w-0">
                        <span className={`studio-status ${KIND_TONE[item.kind]}`}>{KIND_LABEL[item.kind]}</span>
                        <span className="mt-1 block break-words font-semibold">{itemName(item)}</span>
                        {item.upload ? (
                          <span className="studio-sub block">
                            {item.upload.kind === 'VIDEO' ? 'Video' : 'Audio'} · {formatBytes(item.upload.sizeBytes)}
                            {item.upload.durationSec ? ` · ${formatDuration(item.upload.durationSec)}` : ''} ·{' '}
                            <span className={item.upload.status === 'READY' ? 'tone-success' : 'tone-warning'}>{STATUS_LABEL[item.upload.status]}</span>
                          </span>
                        ) : (
                          <span className="studio-sub block break-all text-hud">{item.id}</span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td>
                    {item.uses.length === 0 ? (
                      <span className="studio-status tone-muted">Not used</span>
                    ) : (
                      <ul className="grid gap-1">
                        {item.uses.map((use) => (
                          <li key={use.lessonId}>
                            <Link href={lessonHref(use.courseId, use.lessonId, use.draft)}>{use.lessonTitle}</Link>
                            <span className="studio-sub">
                              {' '}
                              · {use.courseTitle}
                              {use.draft ? ' · draft' : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {item.url ? (
                      <span className="inline-flex flex-wrap justify-end gap-2">
                        <a href={item.url} target="_blank" rel="noreferrer noopener" className="btn btn-secondary px-3 py-1 text-sm">
                          Open
                        </a>
                        <CopyLink url={item.url} />
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="studio-sub">
        Link health (flagging a YouTube video that became public or was deleted, or a Drive file that allows downloading) comes with the YouTube and Google
        Drive connection.
      </p>
    </>
  );
}
