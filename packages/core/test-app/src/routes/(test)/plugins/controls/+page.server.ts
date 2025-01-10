import { extract_options_from_url } from '$lib/helpers.js';
import { SCHEMAS } from '$lib/schemas.js';

export function load({ request }) {
	return extract_options_from_url(request, SCHEMAS.PLUGINS.CONTROLS);
}