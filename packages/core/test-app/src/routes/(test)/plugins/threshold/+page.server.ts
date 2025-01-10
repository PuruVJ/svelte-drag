import { extract_options_from_url } from '$lib/helpers.js';
import { SCHEMAS } from '$lib/schemas.js';

export function load({ request }) {
	const threshold = extract_options_from_url(request, SCHEMAS.PLUGINS.THRESHOLD);

	return { threshold };
}
