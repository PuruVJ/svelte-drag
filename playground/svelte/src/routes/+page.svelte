<script lang="ts">
	import { sineIn } from 'svelte/easing';
	import { tweened } from 'svelte/motion';

	import { draggable } from '@neodrag/svelte';

	let boundToBody = false;
	let handleEl: HTMLElement;

	$: options = {
		ignoreMultitouch: false,
		applyUserSelectHack: true,
		axis: 'both',
		cancel: '.cancel',
		handle: handleEl,
		defaultPosition: { x: 0, y: 0 },
		disabled: false,
		gpuAcceleration: true,
		threshold: {
			delay: 5,
		},
		defaultClass: 'neodrag',
		// grid: [100, 100],
		// bounds: boundToBody ? 'body' : undefined,
		// bounds: { top: 100, left: 100, right: 100, bottom: 40 },
		// bounds: 'body',
	} satisfies DragOptions;

	// $: console.log(options);

	let progressY = tweened(0, { easing: sineIn, duration: 0 });
	let progressX = tweened(100, { easing: sineIn, duration: 0 });

	const minScale = 0.25;
	const maxScale = 4;
	const scaleStep = 0.05;
	let scale = 1;
</script>

<br /><br /><br /><br /><br />

<main>
	<div class="panel">
		<h1>Welcome to SvelteKit</h1>
		<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

		<label>
			Apply user select hack
			<input type="checkbox" bind:checked={options.applyUserSelectHack} />
		</label>

		<br /> <br />

		<label>
			Bound to body
			<input type="checkbox" bind:checked={boundToBody} />
		</label>

		<br /> <br />

		<div>
			Axis:

			<label>
				<input type="radio" bind:group={options.axis} value="both" />
				Both
			</label>

			<label>
				<input type="radio" bind:group={options.axis} value="x" />
				x
			</label>

			<label>
				<input type="radio" bind:group={options.axis} value="y" />
				y
			</label>

			<label>
				<input type="radio" bind:group={options.axis} value="none" />
				none
			</label>
		</div>

		<br />

		<div>
			Cancel:

			<label>
				<input type="radio" bind:group={options.cancel} value=".cancel" />
				.cancel
			</label>

			<label>
				<input type="radio" bind:group={options.cancel} value=".cancel-2" />
				.cancel-2
			</label>

			<label>
				<input type="radio" bind:group={options.cancel} value={undefined} />
				undefined
			</label>
		</div>

		<br />

		<div>
			handle:

			<label>
				<input type="radio" bind:group={options.handle} value=".handle" />
				.handle
			</label>

			<label>
				<input type="radio" bind:group={options.handle} value=".handle-2" />
				.handle-2
			</label>

			<label>
				<input type="radio" bind:group={options.handle} value={undefined} />
				undefined
			</label>
		</div>

		<br />

		<div>
			Default class: <input bind:value={options.defaultClass} />
		</div>

		<br />

		<div>
			<label>
				Disabled
				<input type="checkbox" bind:checked={options.disabled} />
			</label>
		</div>

		<div>
			<label>
				Ignore Multitouch
				<input type="checkbox" bind:checked={options.ignoreMultitouch} />
			</label>
		</div>

		<div>
			<label>
				Scale
				<input type="range" min={minScale} max={maxScale} step={scaleStep} bind:value={scale} />
				{scale}
			</label>
		</div>
	</div>

	<div class="canvas" style="transform: scale({scale});">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			use:draggable={options}
			on:neodrag:start={(e) => console.log(e.detail)}
			class="box"
			on:click={() => {
				console.log('Should only trigger on click, and not after dragging');
			}}
		>
			hello

			<div class="handle" bind:this={handleEl}>Le handel</div>
			<div class="cancel">Cancel</div>

			<div class="handle-2">Le handel 2</div>
			<div class="cancel-2">Cancel 2</div>
		</div>
	</div>

	<div class="canvas" style="transform: scale({scale});">
		<div
			use:draggable={{
				cancel: '.cancel',
				bounds: document.body,
				onDrag: ({ offsetX, offsetY }) => {
					progressX.set(offsetX);
					progressY.set(offsetY);
				},
			}}
			class="box"
		>
			2nd one

			<div class="handle">Le handel</div>
			<div class="cancel">Cancel</div>

			<div class="handle-2">Le handel 2</div>
			<div class="cancel-2">Cancel 2</div>
		</div>
	</div>

	<div class="canvas" style="transform: scale({scale});">
		<input type="number" bind:value={$progressX} />
		<input type="number" bind:value={$progressY} />
		<div
			use:draggable={{
				position: { y: $progressY, x: $progressX },
				onDrag: ({ offsetX, offsetY }) => {
					$progressX = 0;
					$progressY = 0;
					progressX.set(offsetX, { duration: 0 });
					progressY.set(offsetY, { duration: 0 });
				},
				onDragEnd: ({}) => {
					progressX.set(0, { duration: 300 });
					progressY.set(0, { duration: 300 });
				},
			}}
			class="box"
		/>
	</div>
</main>

<style>
	:global(body) {
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		background-color: rgb(26, 32, 39);
		color: white;
		font-family: monospace;
	}

	:global(html, #svelte) {
		width: 100%;
		height: 100%;
	}

	main {
		display: flex;
		width: 100%;
		height: 100%;
	}

	.panel {
		margin: 30px;
		flex-grow: 0;
	}

	.canvas {
		flex-grow: 1;
		transform-origin: top left;
		background-color: #242629;
		border-left: 1px solid white;
	}

	.box {
		width: 200px;
		height: 200px;

		background-color: aquamarine;
		color: black;
	}
</style>
