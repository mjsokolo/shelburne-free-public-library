import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { load } from 'cheerio';

const source = JSON.parse(await readFile('migration/source-pages.json', 'utf8'));
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');

for (const page of source) {
  const path = new URL(page.link).pathname;
  test(`migrated page ${path} has accessible structure and working local references`, async () => {
    const document = load(await readFile(`dist${path}index.html`, 'utf8'));
    assert.equal(document('h1').length, 1, 'Exactly one main heading');
    assert.equal(document('main').length, 1);
    assert.ok(document('title').text().includes('Shelburne Free Public Library'));
    assert.equal(document('html').attr('lang'), 'en');
    assert.ok(document('main p, main img, main dl, main ul, main ol').length > 0, 'Page has content beyond its heading');
    assert.equal(document('script[src*="wp-"], form[action*="wp-"]').length, 0);
    for (const element of document('a[href], img[src], link[href]').toArray()) {
      const value = document(element).attr(element.tagName === 'img' ? 'src' : 'href');
      if (!value?.startsWith('/') || value.startsWith('//')) continue;
      assert.ok(!base || value.startsWith(`${base}/`), `Missing base path: ${value}`);
      const target = new URL(value, 'https://example.org').pathname.slice(base.length);
      await access(`dist${decodeURIComponent(target)}${target.endsWith('/') ? 'index.html' : ''}`);
    }
    for (const image of document('img').toArray()) assert.ok(document(image).attr('alt'), 'Image has descriptive alt text');
  });
}

test('404 page exists', async () => { await access('dist/404.html'); });
