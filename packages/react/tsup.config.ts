import { defineConfig } from 'tsup';

export default defineConfig([
	{
		entry: [`./src/index.ts`],
		format: 'esm',
		dts: { resolve: true },
		external: ['react', '@neodrag/core'],
		clean: true,
		treeshake: 'smallest',
	},
]);
