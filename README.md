# Shelburne Free Public Library

A static Astro rebuild of the existing library website, ready for GitHub Pages. No WordPress server, database, or React runtime is needed. The live website and DNS have not been changed.

## Local Development

Use Node 24 (`nvm use` if you use nvm), then:

```sh
npm ci
npm run dev
```

Open the URL printed by Astro. To check the production build:

```sh
npm run build
npm test
```

## Editing on GitHub

- Edit page text in `src/content/pages/*.md`. Keep the `path` field unchanged to preserve existing links.
- Edit hours, address, phone, email, and director in `src/data/library.json`. This is the source for the homepage, hours page, contact page, and footer.
- Homepage layout and service links live in `src/pages/[...slug].astro`; shared navigation and footer live in `src/layouts/Site.astro`.
- Add images and documents under `public/media/`, then reference them as `/media/your-file.jpg` in Markdown.
- Add a page by creating a Markdown file with `title` and a unique `path` in its frontmatter. Add a navigation link if needed.
- Changes pushed to `main` trigger deployment once Pages is configured.

The original homepage, hours, contact, and help-index Markdown are retained as source references; their displayed content comes from the shared data/templates above. The original curbside page was empty, so the replacement directs patrons to contact the library.

## GitHub Pages

1. Push these files to `main` when ready.
2. In the repository, open **Settings > Pages > Build and deployment** and select **GitHub Actions** as the source.
3. Open **Actions > Deploy to GitHub Pages** and run the workflow if it has not already run successfully.
4. The initial address will be `https://mjsokolo.github.io/shelburne-free-public-library/`.

The workflow derives the site origin and base path from GitHub Pages, so internal links and local media work under the repository URL. To check that configuration locally:

```sh
BASE_PATH=/shelburne-free-public-library npm run build
BASE_PATH=/shelburne-free-public-library npm test
```

## Custom Domain Later

Only after reviewing the replacement: configure the domain in **Settings > Pages > Custom domain**, update DNS using GitHub's current Pages instructions, and enable HTTPS once available. Re-run the workflow after changing the domain so canonical URLs and base paths are rebuilt. No custom domain or DNS changes are included here.

## Migration and Review

Imported 18 published pages and their referenced media on October 17, 2026. All original page paths, including nested help pages and the unusually named `/hours/` Commonwealth Catalog page, are preserved. Duplicate navigation, WordPress comments, the empty calendar widget, and plugin scripts are not carried over.

`migration/source-pages.json` preserves the original API response. The one-time `npm run import:wordpress` script downloads that content and media; it intentionally refuses to overwrite existing Markdown. It is not part of deployment.

Before replacing the live site, verify hours, director/contact details, image descriptions, service policies, hotspot flyers, and external catalog/resource links with the library. Imported instructions may be outdated; no new events or policies have been invented. Confirm permission to republish the original content/images. External services remain external and are not mirrored. Fonts are loaded from Google Fonts, with local fallbacks if unavailable.
