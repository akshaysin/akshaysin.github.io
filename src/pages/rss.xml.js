import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
	const now = new Date();
	const posts = await getCollection(
		'blog',
		({ data }) => !data.draft && data.pubDate <= now,
	);
	posts.sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id),
	);
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		// Only map the fields RSS understands; spreading `post.data` would also
		// leak `draft`, `heroImage` metadata objects and other internal fields.
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			categories: [post.data.category, ...(post.data.tags ?? [])].filter(Boolean),
			author: post.data.author,
			link: `/blog/${post.id}/`,
		})),
		customData: '<language>en-us</language>',
	});
}
