import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { load, workspaceContext } from '@/lib/guard.ts';
import { messageTime } from '@/lib/messages.ts';
import { ReplyForm } from './ReplyForm';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> };

export const metadata: Metadata = { title: 'Inbox' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Support inbox (FR-CHAT-1301; design screen 15, Studio "Inbox"): every learner's conversation with Oxinov
 * support, newest first, with unread markers. Opening one marks it read; a reply notifies the learner.
 * Questions learners pass on from OXI arrive here too.
 */
export default async function InboxPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const wanted = (await searchParams).t;
  const here = `/w/${slug}/studio/inbox`;
  const { token, workspace } = await workspaceContext(slug, here);
  const threads = await load(here, () => eduApi.supportInbox(token, workspace.id));
  const selectedId = wanted && UUID.test(wanted) ? wanted : threads[0]?.id;
  const thread = selectedId ? await eduApi.supportThread(token, workspace.id, selectedId).catch(() => null) : null;
  const now = new Date();

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// Business</span>
        <h1 className="studio-title">Inbox</h1>
        <p className="text-sm text-muted">Learners write to Oxinov support from Account › Messages, or pass a question on from OXI. They see your replies as &quot;Oxinov support&quot;.</p>
      </div>
      {threads.length === 0 ? (
        <p className="studio-panel px-5 py-4 text-muted">No messages yet.</p>
      ) : (
        <div className="msg-layout">
          <nav className="msg-list" aria-label="Conversations">
            {threads.map((item) => (
              <Link key={item.id} href={`${here}?t=${item.id}`} aria-current={item.id === thread?.id ? 'true' : undefined} className="msg-conv" scroll={false}>
                <span className="msg-avatar" style={{ background: 'var(--ox-color-brand)' }} aria-hidden="true">
                  {(item.learnerName ?? item.learnerEmail ?? '?').slice(0, 2).toUpperCase()}
                </span>
                <span className="grid min-w-0">
                  <span className="truncate font-semibold">{item.learnerName ?? item.learnerEmail ?? 'Learner'}</span>
                  <span className="truncate text-sm text-muted">
                    {item.lastSender === 'STAFF' ? 'You: ' : ''}
                    {item.lastMessage}
                  </span>
                </span>
                <span className="grid justify-items-end gap-1">
                  <span className="text-hud text-[0.6875rem] text-muted">{messageTime(item.lastMessageAt, now, workspace.timeZone)}</span>
                  {item.unread && item.id !== thread?.id ? (
                    <span className="msg-dot">
                      <span className="sr-only">Unread</span>
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </nav>
          {thread ? (
            <section className="msg-pane" aria-label={`Conversation with ${thread.learnerName ?? 'learner'}`}>
              <header className="msg-head">
                <span className="grid">
                  <span className="font-studio text-lg font-bold">{thread.learnerName ?? 'Learner'}</span>
                  <span className="studio-sub break-all">{thread.learnerEmail}</span>
                </span>
              </header>
              <div className="msg-thread grid-bg">
                {thread.messages.map((message) => (
                  <div key={message.id} className={`msg ${message.sender === 'STAFF' ? 'msg-me' : 'msg-them'}`}>
                    <span className="msg-label" style={{ color: message.sender === 'STAFF' ? 'var(--ox-color-brand)' : 'var(--ox-color-product-services)' }}>
                      {message.sender === 'STAFF' ? 'OXINOV SUPPORT' : (thread.learnerName ?? 'LEARNER').toUpperCase()} · {messageTime(message.createdAt, now, workspace.timeZone)}
                    </span>
                    <span className="whitespace-pre-line break-words text-sm leading-relaxed">{message.body}</span>
                  </div>
                ))}
              </div>
              <ReplyForm slug={slug} tenantId={workspace.id} threadId={thread.id} />
            </section>
          ) : (
            <p className="p-5 text-muted">Choose a conversation.</p>
          )}
        </div>
      )}
    </>
  );
}
