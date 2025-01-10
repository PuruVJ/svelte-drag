import { defineConfig } from 'tsup';

export default defineConfig([
	{
		entry: {
			index: `./src/index.ts`,
			plugins: `./src/plugins.ts`,
		},
		format: 'esm',
		dts: { resolve: true },
		clean: true,
		treeshake: 'smallest',
	},
]);
