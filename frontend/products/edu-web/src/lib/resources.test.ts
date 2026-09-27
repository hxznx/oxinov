// Unit tests for resource helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resourceContentType, resourceLabel, titleFromFileName } from './resources.ts';

describe('lesson resources', () => {
  it('maps file names to accepted types', () => {
    assert.equal(resourceContentType({ name: 'Book.EPUB', type: '' }), 'application/epub+zip');
    assert.equal(resourceContentType({ name: 'workbook.pdf', type: 'application/pdf' }), 'application/pdf');
    assert.equal(resourceContentType({ name: 'slides.pptx', type: 'application/octet-stream' }), 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    assert.equal(resourceContentType({ name: 'page.html', type: 'text/html' }), null);
    assert.equal(resourceContentType({ name: 'logo.svg', type: 'image/svg+xml' }), null);
  });

  it('suggests readable titles and labels', () => {
    assert.equal(titleFromFileName('N5_kanji-workbook.pdf'), 'N5 kanji workbook');
    assert.equal(titleFromFileName('.pdf'), 'Resource');
    assert.equal(resourceLabel('application/pdf'), 'PDF');
    assert.equal(resourceLabel('application/vnd.openxmlformats-officedocument.wordprocessingml.document'), 'Word');
  });
});
