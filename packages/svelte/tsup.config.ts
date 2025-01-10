import { defineConfig } from 'tsup';

export default defineConfig([
	{
		entry: [`./src/index.ts`],
		format: 'esm',
		dts: true,
		external: ['svelte/action', '@neodrag/core'],
		clean: true,
		treeshake: 'smallest',
	},
]);
