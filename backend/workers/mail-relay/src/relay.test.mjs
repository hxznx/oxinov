// Unit tests for the SMTP relay, over a real socket. Run: pnpm --filter @oxinov/mail-relay test
import assert from 'node:assert/strict';
import { once } from 'node:events';
import net from 'node:net';
import { after, before, describe, it } from 'node:test';
import { createRelay } from './relay.mjs';

/** Minimal SMTP client: sends each command after the previous reply and returns every reply code. */
async function converse(port, commands) {
  const socket = net.connect(port, '127.0.0.1');
  socket.setEncoding('utf8');
  let buffer = '';
  const replies = [];
  const nextReply = () =>
    new Promise((resolve) => {
      const check = () => {
        // A complete reply ends with a line "NNN text" (a space, not a dash, after the code).
        const lines = buffer.split('\r\n');
        const done = lines.findIndex((line) => /^\d{3} /.test(line));
        if (done === -1) return false;
        buffer = lines.slice(done + 1).join('\r\n');
        resolve(Number(lines[done].slice(0, 3)));
        return true;
      };
      if (!check()) {
        const onData = (data) => {
          buffer += data;
          if (check()) socket.off('data', onData);
        };
        socket.on('data', onData);
      }
    });
  replies.push(await nextReply());
  for (const command of commands) {
    socket.write(`${command}\r\n`);
    replies.push(await nextReply());
  }
  socket.end();
  return replies;
}

describe('mail relay', () => {
  const sent = [];
  const events = [];
  let failNext = null;
  let port = 0;
  const relay = createRelay({
    allowedFrom: 'no-reply@oxinov.com',
    maxBytes: 2048,
    maxRecipients: 2,
    log: (event) => events.push(event),
    send: async (message) => {
      if (failNext) {
        const error = failNext;
        failNext = null;
        throw error;
      }
      sent.push(message);
    },
  });

  before(async () => {
    relay.listen(0, '127.0.0.1');
    await once(relay.server, 'listening');
    port = relay.server.address().port;
  });
  after(() => relay.close());

  const message = ['DATA', 'Subject: Your Oxinov code\r\n\r\n123456\r\n.'];

  it('forwards a message from the allowed sender to SES', async () => {
    const replies = await converse(port, ['EHLO keycloak', 'MAIL FROM:<No-Reply@oxinov.com>', 'RCPT TO:<learner@example.com>', ...message, 'QUIT']);
    assert.deepEqual(replies, [220, 250, 250, 250, 354, 250, 221]);
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].to, ['learner@example.com']);
    assert.equal(sent[0].from, 'no-reply@oxinov.com');
    assert.match(sent[0].raw.toString(), /123456/);
  });

  it('refuses other senders, too many recipients, and large messages', async () => {
    assert.equal((await converse(port, ['EHLO x', 'MAIL FROM:<ceo@oxinov.com>']))[2], 550);
    const many = await converse(port, ['EHLO x', 'MAIL FROM:<no-reply@oxinov.com>', 'RCPT TO:<a@example.com>', 'RCPT TO:<b@example.com>', 'RCPT TO:<c@example.com>']);
    assert.equal(many[5], 452);
    const big = await converse(port, ['EHLO x', 'MAIL FROM:<no-reply@oxinov.com>', 'RCPT TO:<a@example.com>', 'DATA', `Subject: big\r\n\r\n${'x'.repeat(4096)}\r\n.`]);
    assert.equal(big[5], 552);
    assert.equal(sent.length, 1);
  });

  it('answers a temporary failure when SES refuses, so the sender can retry', async () => {
    failNext = Object.assign(new Error('throttled'), { name: 'TooManyRequestsException', $metadata: { httpStatusCode: 429 } });
    const replies = await converse(port, ['EHLO x', 'MAIL FROM:<no-reply@oxinov.com>', 'RCPT TO:<a@example.com>', ...message]);
    assert.equal(replies[5], 451);
    assert.ok(events.some((event) => event.event === 'mail.failed' && event.status === 429 && event.permanent === false));
  });

  it('answers a permanent failure with the SES reason, without the address, when SES rejects the recipient', async () => {
    failNext = Object.assign(
      new Error('Email address is not verified. The following identities failed the check in region AP-SOUTH-1: learner.test@example.com'),
      { name: 'MessageRejected', $metadata: { httpStatusCode: 400 } },
    );
    const replies = await converse(port, ['EHLO x', 'MAIL FROM:<no-reply@oxinov.com>', 'RCPT TO:<learner.test@example.com>', ...message]);
    assert.equal(replies[5], 550);
    const failed = events.findLast((event) => event.event === 'mail.failed');
    assert.equal(failed.error, 'MessageRejected');
    assert.equal(failed.permanent, true);
    assert.match(failed.reason, /^Email address is not verified\..*: \[address\]$/);
  });

  it('never logs addresses or message content', () => {
    const logged = JSON.stringify(events);
    assert.doesNotMatch(logged, /example\.com|123456/);
    assert.ok(events.some((event) => event.event === 'mail.sent' && event.recipients === 1));
  });
});
