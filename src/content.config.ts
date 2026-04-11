import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Per-entry SEO overrides. All optional — empty fields fall back to the
// visible `title` / `description` for meta tags and to a self-referring
// canonical URL. Editors can override any of these in the CMS.
const seoSchema = z
  .object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    canonical: z.string().url().optional(),
    noindex: z.boolean().optional(),
  })
  .optional();

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    category: z.string().optional(),
    keyInsights: z.array(z.string()).optional(),
    seo: seoSchema,
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    order: z.number().default(0),
    category: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date().optional(),
    seo: seoSchema,
  }),
});

// Unified settings collection — one JSON file per "slice" (site, nav, footer).
// Loaded via glob so each file becomes an entry with id = filename (without .json).
// Schema is loose (all fields optional) so each file only needs to provide its own slice.
const settings = defineCollection({
  loader: glob({
    pattern: '*.json',
    base: './src/content/settings',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
  schema: z.object({
    siteName: z.string().optional(),
    defaultDescription: z.string().optional(),
    ogImage: z.string().optional(),
    contactEmail: z.string().optional(),
    ga4Id: z.string().optional(),
    adSenseClient: z.string().optional(),
    ahrefsKey: z.string().optional(),
    nav: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
        })
      )
      .optional(),
    footerLinks: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
        })
      )
      .optional(),
    disclaimer: z.string().optional(),
  }),
});

export const collections = { guides, faqs, pages, settings };
