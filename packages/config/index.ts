import { Format } from 'tsup';
import { defineConfig } from 'tsup';

export const core_config = ({
	modularAsIndex = false,
	dtsBanner = '',
	includeUMD = false,
	globalName = 'neodrag',
} = {}) =>
	defineConfig([
		{
			entry: {
				index: `./src/${modularAsIndex ? 'modular' : 'index'}.ts`,
			},
			format: 'esm',
			external: ['vue', 'react', 'solid-js', 'svelte'],
			dts: { resolve: true, banner: dtsBanner },
			clean: true,
			treeshake: 'smallest',
		},
		{
			entry: {
				index: `./src/${modularAsIndex ? 'modular' : 'index'}.ts`,
			},
			minify: 'terser',
			external: ['vue', 'react', 'solid-js', 'svelte'],
			format: 'esm',
			clean: true,
			outDir: 'dist/min',
			treeshake: 'smallest',
		},
		// UMD configuration
		...(includeUMD
			? [
					{
						entry: ['./src/index.ts'],
						format: 'umd' as Format,
						globalName,
						dts: { resolve: true, banner: dtsBanner },
						clean: true,
						outDir: 'dist/umd',
						treeshake: true,
					},
				]
			: []),
	]);
