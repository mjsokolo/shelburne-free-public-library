import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import TurndownService from 'turndown';

const origin = 'http://www.shelburnefreepubliclibrary.org';
const response = await fetch(`${origin}/wp-json/wp/v2/pages?per_page=100`);
assert.ok(response.ok, `WordPress returned ${response.status}`);
const pages = await response.json();
assert.ok(Array.isArray(pages) && pages.length > 0, 'No pages returned');
assert.equal(Number(response.headers.get('x-wp-totalpages') ?? 1), 1, 'API pagination needs review');
const paths = new Map(pages.map(page => [page.id, new URL(page.link).pathname]));
const markdown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
const assets = new Set();

async function saveAsset(url) {
  const asset = new URL(url, origin);
  const local = `/media/${asset.pathname.split('/uploads/')[1]}`;
  if (assets.has(local)) return local;
  assets.add(local);
  const result = await fetch(asset);
  assert.ok(result.ok, `Cannot download ${asset}: ${result.status}`);
  const destination = `public${local}`;
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await result.arrayBuffer()));
  return local;
}

const destinations = pages.map(page => `src/content/pages/${page.slug}.md`);
for (const destination of destinations) {
  try {
    await access(destination);
    throw new Error(`${destination} already exists; import into a fresh checkout to avoid overwriting edits.`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await mkdir('migration', { recursive: true });
await writeFile('migration/source-pages.json', `${JSON.stringify(pages, null, 2)}\n`);
for (const page of pages) {
  const document = load(page.content.rendered, null, false);
  document('script, style, iframe, form').remove();
  document('h1').each((_, element) => { element.tagName = 'h2'; });
  document('*').removeAttr('style').removeAttr('class').removeAttr('id');
  for (const element of document('a[href], img[src]').toArray()) {
    const attribute = element.tagName === 'img' ? 'src' : 'href';
    const value = document(element).attr(attribute);
    const url = new URL(value, origin);
    if (url.hostname !== new URL(origin).hostname) continue;
    if (url.pathname.startsWith('/wp-content/uploads/')) {
      document(element).attr(attribute, await saveAsset(url));
    } else {
      document(element).attr(attribute, `${url.pathname}${url.search}${url.hash}`);
    }
    if (element.tagName === 'img') {
      document(element).removeAttr('srcset').removeAttr('sizes');
      if (!document(element).attr('alt')) document(element).attr('alt', load(page.title.rendered).text());
    }
  }
  document('p').each((_, element) => {
    if (!document(element).text().trim() && !document(element).find('img').length) document(element).remove();
  });
  const title = load(page.title.rendered).text();
  const body = markdown.turndown(document.html()).trim();
  const frontmatter = `---\ntitle: ${JSON.stringify(title)}\npath: ${JSON.stringify(paths.get(page.id))}\nsource: ${JSON.stringify(page.link)}\n---\n\n`;
  await mkdir('src/content/pages', { recursive: true });
  await writeFile(`src/content/pages/${page.slug}.md`, `${frontmatter}${body}\n`);
}
await saveAsset(`${origin}/wp-content/uploads/2015/04/12-e1429630924157.jpg`);
assert.equal(new Set(paths.values()).size, pages.length, 'Duplicate page paths');
console.log(`Imported ${pages.length} pages and ${assets.size} media files. Source saved in migration/source-pages.json.`);
