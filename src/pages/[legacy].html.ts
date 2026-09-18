import type { APIRoute } from 'astro';
import { LEGACY_REDIRECTS } from '../legacy-redirects';

// A file endpoint (rather than an `.astro` page or the `redirects` config) so
// that the output lands at `dist/<name>.html` exactly. Astro's default
// directory build format would otherwise emit `dist/<name>.html/index.html`,
// which GitHub Pages does not serve for a request to `/<name>.html`.
export function getStaticPaths() {
	return Object.entries(LEGACY_REDIRECTS).map(([legacy, target]) => ({
		params: { legacy },
		props: { target },
	}));
}

export const GET: APIRoute<{ target: string }> = ({ props, site }) => {
	const { target } = props;
	const absolute = new URL(target, site).href;
	const body = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>Moved</title>
		<link rel="canonical" href="${absolute}" />
		<meta http-equiv="refresh" content="0;url=${target}" />
		<meta name="robots" content="noindex, follow" />
	</head>
	<body>
		<p>This page has moved to <a href="${target}">${absolute}</a>.</p>
	</body>
</html>
`;
	return new Response(body, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
};
