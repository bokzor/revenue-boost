import { defineConfig, defineCollection, s } from 'velite'

// Blog post categories
const categories = ['guides', 'tutorials', 'updates', 'case-studies', 'tips'] as const

const posts = defineCollection({
  name: 'Post',
  pattern: 'blog/**/*.mdx',
  schema: s
    .object({
      // Core fields
      title: s.string().max(99),
      description: s.string().max(200),
      date: s.isodate(),
      published: s.boolean().default(true),
      
      // Categorization
      category: s.enum(categories),
      tags: s.array(s.string()).default([]),
      
      // Media
      image: s.image().optional(),
      imageAlt: s.string().optional(),
      
      // SEO overrides (optional - falls back to title/description)
      seoTitle: s.string().max(70).optional(),
      seoDescription: s.string().max(160).optional(),
      
      // Content
      body: s.mdx(),

      // Auto-generated from file path
      slug: s.path(),
      toc: s.toc(),
    })
    .transform((data) => {
      // Extract just the filename part from the path (remove blog/ prefix)
      const slug = data.slug.replace(/^blog\//, '')
      return {
        ...data,
        slug,
        // Computed permalink
        permalink: `/blog/${slug}`,
        // Reading time estimation (rough: 200 words per minute)
        readingTime: Math.ceil(data.body.split(/\s+/).length / 200),
      }
    }),
})

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: { posts },
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

