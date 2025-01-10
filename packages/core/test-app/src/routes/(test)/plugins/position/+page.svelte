<script>
	import Box from '$lib/Box.svelte';
	import { events, position } from '../../../../../../src/plugins';

	const { data } = $props();

	let pos = $state(data.options?.current ?? { x: 0, y: 0 });

	const plugins = $derived.by(() => {
		if (data.options?.two_way_binding) {
			return [
				position({
					current: $state.snapshot(pos),
					default: data.options.current,
				}),
				events({
					onDrag: ({ offset }) => {
						if (pos) {
							pos.x = offset.x;
							pos.y = offset.y;
						}
					},
				}),
			];
		}

		return [
			position({
				default: data.options?.default,
				current: data.options?.current,
			}),
		];
	});
</script>

<Box testid="draggable" {plugins}></Box>

<label>
	X:
	<input type="range" min="0" max="1000" bind:value={pos.x} data-testid="x-slider" />
</label>

<label>
	Y:
	<input type="range" min="0" max="1000" bind:value={pos.y} data-testid="y-slider" />
</label>
