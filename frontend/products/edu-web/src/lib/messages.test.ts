// Unit tests for the messages helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handoffMessage, messageProblem, messageTime, parseConversation } from './messages.ts';

describe('messages helpers (FR-CHAT-1301, FR-AI-1705)', () => {
  it('reads the conversation from the address', () => {
    assert.equal(parseConversation('support'), 'support');
    assert.equal(parseConversation(['support']), 'support');
    assert.equal(parseConversation('teacher'), 'oxi');
    assert.equal(parseConversation(undefined), 'oxi');
  });

  it('passes the learner’s question to support', () => {
    assert.equal(handoffMessage('  My payment is missing '), '(Passed on from OXI) My payment is missing');
    assert.equal(handoffMessage(''), '(Passed on from OXI) I would like to talk to a person, please.');
    assert.ok(handoffMessage('x'.repeat(5000)).length <= 4000);
  });

  it('checks message length', () => {
    assert.equal(messageProblem('  '), 'Write a message first.');
    assert.equal(messageProblem('Hello'), null);
    assert.equal(messageProblem('x'.repeat(4001)), 'Keep the message under 4,000 characters.');
  });

  it('shows a short time', () => {
    const now = new Date('2026-10-03T06:00:00Z');
    assert.equal(messageTime('2026-10-03T04:13:00Z', now, 'Asia/Kathmandu'), '09:58');
    assert.equal(messageTime('2026-10-01T04:13:00Z', now, 'Asia/Kathmandu'), 'Thu');
    assert.equal(messageTime('2026-08-01T04:13:00Z', now, 'Asia/Kathmandu'), '1 Aug');
  });
});
