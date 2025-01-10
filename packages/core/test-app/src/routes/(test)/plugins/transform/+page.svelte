<script lang="ts">
	import { createDraggable } from '../../../../../../src';
	import { transform } from '../../../../../../src/plugins';

	const { data } = $props();

	const { draggable } = createDraggable({
		plugins: [],
	});

	function func({
		offsetX,
		offsetY,
		rootNode,
	}: Parameters<Exclude<Parameters<typeof transform>[0], undefined>>[0]) {
		if (rootNode instanceof SVGElement) {
			rootNode.setAttribute('transform', `translate(${offsetX} ${offsetY})`);
			rootNode.dataset.proofFuncWorked = '';
		} else {
			rootNode.style.left = `${offsetX}px`;
			rootNode.style.top = `${offsetY}px`;
		}
	}
</script>

{#if data.is_svg}
	<svg width="400" height="400" viewBox="0 0 400 400">
		<circle
			use:draggable={[transform(data.is_func ? func : undefined)]}
			cx="100"
			cy="100"
			r="50"
			fill="blue"
			opacity="0.5"
			data-testid="draggable"
		/>
	</svg>
{:else}
	<div
		class="box"
		style:position={data.is_func ? 'absolute' : null}
		use:draggable={[transform(data.is_func ? func : undefined)]}
		data-testid="draggable"
	></div>
{/if}

<style>
	.box {
		width: 100px;
		height: 100px;
		background-color: cyan;
	}

	svg {
		border: 1px solid #ccc;
		background: white;
	}
</style>
