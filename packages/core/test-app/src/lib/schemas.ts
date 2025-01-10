import { z } from 'zod';

export const SCHEMAS = {
	PLUGINS: {
		AXIS: z.enum(['x', 'y']).optional(),

		BOUNDS: z.object({
			type: z.enum(['parent', 'element', 'viewport', 'selector']),
			selector: z.string().optional(),
			padding: z
				.object({
					top: z.number().optional(),
					right: z.number().optional(),
					bottom: z.number().optional(),
					left: z.number().optional(),
				})
				.optional(),
			is_smaller_than_element: z.boolean().optional(),
		}),

		APPLY_USER_SELECT_HACK: z.boolean(),

		GRID: z.tuple([z.number().nullable().optional(), z.number().nullable().optional()]).optional(),

		TRANSFORM: z.object({
			is_func: z.boolean(),
			is_svg: z.boolean(),
		}),

		THRESHOLD: z
			.object({
				delay: z.number().optional(),
				distance: z.number().optional(),
			})
			.nullable()
			.optional(),

		CONTROLS: z.object({
			type: z.enum([
				'undefined,null',
				'allow-only',
				'block-only',
				'allow-block',
				'allow-block-allow',
				'block-allow',
				'block-allow-block',
			]),
		}),

		POSITION: z
			.object({
				two_way_binding: z.boolean().optional(),

				default: z
					.object({
						x: z.number(),
						y: z.number(),
					})
					.optional()
					.nullable(),

				current: z
					.object({
						x: z.number(),
						y: z.number(),
					})
					.optional()
					.nullable(),
			})
			.optional()
			.nullable(),

		TOUCH_ACTION: z.enum(['undefined', 'null', 'auto', 'false']),
	},
};
