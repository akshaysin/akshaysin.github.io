import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			heroImageAlt: z.string().optional(),
			category: z.string().optional(),
			// Older posts write tags as a comma-separated string; newer ones can
			// use a YAML list. Normalise both to string[].
			tags: z
				.union([z.string(), z.array(z.string())])
				.optional()
				.transform((tags) =>
					typeof tags === 'string'
						? tags
								.split(',')
								.map((tag) => tag.trim())
								.filter(Boolean)
						: tags,
				),
			author: z.string().default('Akshay Sinha'),
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog };
