import { parse } from 'devalue';
import type { ZodSchema } from 'zod';

export function extract_options_from_url<T>(request: Request, schema: ZodSchema<T>) {
	const url = new URL(request.url);

	const decoded = decodeURIComponent(url.searchParams.get('options')!);
	const options = parse(decoded || '');

	const value = schema.parse(options);

	return value;
}
