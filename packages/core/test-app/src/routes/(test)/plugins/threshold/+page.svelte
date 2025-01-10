<script>
	import Box from '$lib/Box.svelte';
	import { threshold } from '../../../../../../src/plugins';

	const { data } = $props();
</script>

<Box testid="draggable" plugins={[threshold(data.threshold)]}></Box>
