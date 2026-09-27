import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupCode, linkedInAddUrl } from './certificate.ts';

test('groups certificate IDs in fours', () => {
  assert.equal(groupCode('ABCDEFGHJKMNPQRS'), 'ABCD-EFGH-JKMN-PQRS');
  assert.equal(groupCode('ABCD'), 'ABCD');
});

test('prefills the LinkedIn certification form with the verification link', () => {
  const url = new URL(
    linkedInAddUrl({
      courseTitle: 'JLPT N5 & more',
      schoolName: 'Oxinov',
      issuedAt: '2026-09-28T10:00:00Z',
      code: 'ABCDEFGHJKMNPQRS',
      verifyUrl: 'https://edu.oxinov.com/verify/ABCDEFGHJKMNPQRS',
    }),
  );
  assert.equal(url.origin + url.pathname, 'https://www.linkedin.com/profile/add');
  assert.equal(url.searchParams.get('name'), 'JLPT N5 & more');
  assert.equal(url.searchParams.get('issueYear'), '2026');
  assert.equal(url.searchParams.get('issueMonth'), '9');
  assert.equal(url.searchParams.get('certUrl'), 'https://edu.oxinov.com/verify/ABCDEFGHJKMNPQRS');
  assert.equal(url.searchParams.get('certId'), 'ABCD-EFGH-JKMN-PQRS');
});
