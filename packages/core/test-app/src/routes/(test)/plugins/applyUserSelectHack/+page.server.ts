import { extract_options_from_url } from '$lib/helpers.js';
import { SCHEMAS } from '$lib/schemas.js';

export function load({ request }) {
	const value = extract_options_from_url(request, SCHEMAS.PLUGINS.APPLY_USER_SELECT_HACK);

	return { value };
}
