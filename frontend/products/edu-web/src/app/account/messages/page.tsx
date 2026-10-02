import type { Metadata } from 'next';
import Link from 'next/link';
import { eduApi } from '@/lib/edu-api.ts';
import { messageTime, parseConversation } from '@/lib/messages.ts';
import { accountContext } from '../data';
import { OxiChat } from './OxiChat';
import { SupportCompose } from './SupportCompose';

export const metadata: Metadata = { title: 'Messages' };

type Props = { searchParams: Promise<{ c?: string }> };

const TIME_ZONE = 'Asia/Kathmandu';

/**
 * Messages (FR-AUTH-104; design screen 15): OXI the course advisor (FR-AI-1705, rule-based until the AI
 * gateway exists), Oxinov support (FR-CHAT-1301), and a link to notices. Teacher conversations come with
 * course chat.
 */
export default async function MessagesPage({ searchParams }: Props) {
  const conversation = parseConversation((await searchParams).c);
  const { token, me, workspace, store } = await accountContext(`/account/messages${conversation === 'support' ? '?c=support' : ''}`);
  // Support lives in the store workspace; reading it here also clears the learner's unread marker.
  const support = workspace && conversation === 'support' ? await eduApi.mySupport(token, workspace.id).catch(() => null) : null;
  const supportUnread = workspace && conversation !== 'support' ? await eduApi.supportUnread(token, workspace.id).catch(() => false) : false;
  const now = new Date();
  const last = support?.messages.at(-1);

  const conversations = [
    { key: 'oxi', avatar: 'OXI', bg: 'linear-gradient(135deg, var(--ox-color-success), var(--ox-color-brand))', name: 'OXI · course advisor', sub: 'Ask what to learn next', unread: false },
    {
      key: 'support',
      avatar: 'OX',
      bg: 'linear-gradient(135deg, var(--ox-color-brand), var(--ox-color-brand-2))',
      name: 'Oxinov support',
      sub: last ? last.body : 'Payments, access, anything else',
      unread: supportUnread,
    },
  ] as const;

  return (
    <>
      <div className="grid gap-1">
        <span className="studio-kicker">// My learning</span>
        <h1 className="studio-title">
          <span className="crumb">Account ›</span> Messages
        </h1>
      </div>
      <div className="msg-layout">
        <nav className="msg-list" aria-label="Conversations">
          {conversations.map((item) => (
            <Link key={item.key} href={`/account/messages?c=${item.key}`} aria-current={conversation === item.key ? 'true' : undefined} className="msg-conv">
              <span className="msg-avatar" style={{ background: item.bg }} aria-hidden="true">
                {item.avatar}
              </span>
              <span className="grid min-w-0">
                <span className="font-semibold">{item.name}</span>
                <span className="truncate text-sm text-muted">{item.sub}</span>
              </span>
              {item.unread ? (
                <span className="msg-dot">
                  <span className="sr-only">New reply</span>
                </span>
              ) : (
                <span />
              )}
            </Link>
          ))}
          <Link href="/account/notifications" className="msg-conv">
            <span className="msg-avatar" style={{ background: 'var(--ox-color-brand-2)' }} aria-hidden="true">
              !
            </span>
            <span className="grid min-w-0">
              <span className="font-semibold">Notices from Oxinov</span>
              <span className="truncate text-sm text-muted">Read-only, in Notifications</span>
            </span>
            <span />
          </Link>
        </nav>

        <section className="msg-pane" aria-label={conversation === 'oxi' ? 'OXI' : 'Oxinov support'}>
          <header className="msg-head">
            <span className="msg-avatar" style={{ background: conversations.find((item) => item.key === conversation)?.bg }} aria-hidden="true">
              {conversation === 'oxi' ? 'OXI' : 'OX'}
            </span>
            <span className="grid">
              <span className="font-studio text-lg font-bold">{conversation === 'oxi' ? 'OXI · course advisor' : 'Oxinov support'}</span>
              <span className="text-hud text-xs" style={{ color: conversation === 'oxi' ? 'var(--ox-color-success)' : 'var(--ox-color-brand)' }}>
                {conversation === 'oxi' ? '● SIMPLE ADVISOR · CAN MAKE MISTAKES' : '● REPLIES WITHIN A DAY'}
              </span>
            </span>
          </header>

          {conversation === 'oxi' ? (
            <OxiChat tenantId={workspace?.id ?? null} />
          ) : !workspace ? (
            <div className="msg-thread">
              <p className="text-muted">
                Join the {store?.name ?? 'Oxinov'} store first, then you can message support here. <Link href="/">Open the store</Link>
              </p>
            </div>
          ) : (
            <>
              <div className="msg-thread grid-bg">
                {!support || support.messages.length === 0 ? (
                  <div className="msg msg-them">
                    <span className="msg-label tone-brand">OXINOV SUPPORT</span>
                    <span className="text-sm">Hi {me.displayName?.split(' ')[0] ?? 'there'}! Ask us anything about payments, access, or your courses.</span>
                  </div>
                ) : (
                  support.messages.map((message) => (
                    <div key={message.id} className={`msg ${message.sender === 'LEARNER' ? 'msg-me' : 'msg-them'}`}>
                      <span className="msg-label" style={{ color: message.sender === 'LEARNER' ? 'var(--ox-color-brand)' : 'var(--ox-color-brand-2)' }}>
                        {message.sender === 'LEARNER' ? 'YOU' : 'OXINOV SUPPORT'} · {messageTime(message.createdAt, now, TIME_ZONE)}
                      </span>
                      <span className="whitespace-pre-line break-words text-sm leading-relaxed">{message.body}</span>
                    </div>
                  ))
                )}
              </div>
              <SupportCompose tenantId={workspace.id} />
            </>
          )}
        </section>
      </div>
    </>
  );
}
