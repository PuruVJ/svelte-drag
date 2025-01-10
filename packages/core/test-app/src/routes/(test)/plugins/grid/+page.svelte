<script>
	import Box from '$lib/Box.svelte';
	import { grid } from '../../../../../../src/plugins';

	const { data } = $props();
</script>

<Box testid="draggable" plugins={[grid(data.grid)]}></Box>
