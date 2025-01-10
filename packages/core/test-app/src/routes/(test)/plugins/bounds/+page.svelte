<script lang="ts">
	import Box from '$lib/Box.svelte';
	import { bounds, BoundsFrom } from '../../../../../../src/plugins.js';

	const { data } = $props();

	let element = $state<HTMLElement>();

	const bounds_from = $derived.by(() => {
		if (data.bounds.type === 'element') {
			return BoundsFrom.element(element!, data.bounds.padding);
		} else if (data.bounds.type === 'viewport') {
			return BoundsFrom.viewport(data.bounds.padding);
		} else if (data.bounds.type === 'parent') {
			return BoundsFrom.parent(data.bounds.padding);
		} else {
			if (!data.bounds.selector)
				throw new Error('bounds selector is required when using selector type');

			return BoundsFrom.selector(data.bounds.selector, data.bounds.padding);
		}
	});

	let is_mounted = $state(false);
	$effect(() => {
		is_mounted = true;
	});
</script>

{#snippet box()}
	{#if is_mounted}
		<Box testid="draggable" plugins={[bounds(bounds_from)]} />
	{/if}
{/snippet}

{#if data.bounds.type === 'parent'}
	<div class="parent">
		{@render box()}
	</div>
{:else if data.bounds.type === 'viewport'}
	{@render box()}
{:else if data.bounds.type === 'selector'}
	<div class="selector">
		<div class="selector-child">
			{@render box()}
		</div>
	</div>
{:else}
	<div class="element" class:smaller={data.bounds.is_smaller_than_element} bind:this={element}>
		{@render box()}
	</div>
{/if}

<style>
	:root {
		--size: 200px;
	}

	.parent {
		width: var(--size);
		height: var(--size);
		background-color: red;
	}

	.selector {
		width: var(--size);
		height: var(--size);
		background-color: yellow;
	}

	.element {
		width: var(--size);
		height: var(--size);
		background-color: green;

		&.smaller {
			width: 90px;
		}
	}
</style>
