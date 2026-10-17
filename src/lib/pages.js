import { load } from 'cheerio';

export const pages = Object.values(import.meta.glob('../content/pages/*.md', { eager: true }));

export function localUrl(path) {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export async function renderContent(page) {
  const document = load(await page.compiledContent(), null, false);
  document('[href], [src]').each((_, element) => {
    for (const attribute of ['href', 'src']) {
      const value = document(element).attr(attribute);
      if (value?.startsWith('/') && !value.startsWith('//')) {
        document(element).attr(attribute, localUrl(value));
      }
    }
  });
  document('a[target="_blank"]').attr('rel', 'noopener noreferrer');
  document('img').attr('loading', 'lazy');
  return document.html();
}
