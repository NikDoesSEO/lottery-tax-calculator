import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Static pages that aren't backed by a content collection entry.
// Everything listed here is indexable; noindex pages (404, admin) are omitted.
// URLs are emitted without trailing slashes to match the existing indexed
// URLs on the live site (see astro.config.mjs `trailingSlash: 'never'`).
const STATIC_PATHS = ['/', '/about', '/contact', '/faqs', '/guides', '/privacy', '/terms'];

type Entry = { loc: string; lastmod?: string };

const toIso = (d: Date) => d.toISOString();

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('`site` must be configured in astro.config.mjs for the sitemap.');
  const base = site.toString().replace(/\/$/, '');

  const [guides, pages] = await Promise.all([getCollection('guides'), getCollection('pages')]);

  // Most-recent content date wins for the homepage + guides index lastmod.
  const latestGuideDate = guides
    .filter((g) => !g.data.seo?.noindex)
    .map((g) => g.data.date)
    .sort((a, b) => b.valueOf() - a.valueOf())[0];

  // Static pages may have an `updated` date in their frontmatter (about, privacy, terms, contact).
  const pageUpdatedBySlug = new Map<string, Date>();
  for (const page of pages) {
    if (page.data.seo?.noindex) continue;
    if (page.data.updated) pageUpdatedBySlug.set(page.id, page.data.updated);
  }

  const entries: Entry[] = [];

  for (const path of STATIC_PATHS) {
    const slug = path.replace(/^\//, '');
    const updated = pageUpdatedBySlug.get(slug);

    let lastmod: string | undefined;
    if (updated) lastmod = toIso(updated);
    else if ((path === '/' || path === '/guides') && latestGuideDate) lastmod = toIso(latestGuideDate);

    entries.push({ loc: `${base}${path}`, lastmod });
  }

  for (const guide of guides) {
    if (guide.data.seo?.noindex) continue;
    entries.push({
      loc: `${base}/guides/${guide.id}`,
      lastmod: toIso(guide.data.date),
    });
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        ({ loc, lastmod }) =>
          `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
