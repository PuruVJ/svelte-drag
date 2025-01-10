<script>
	import Box from '$lib/Box.svelte';
	import { axis } from '../../../../../../src/plugins';

	const { data } = $props();
</script>

<Box testid="draggable" plugins={[axis(data.axis)]}></Box>
