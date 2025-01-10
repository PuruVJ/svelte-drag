<script>
	import Box from '$lib/Box.svelte';
	import { applyUserSelectHack, transform } from '../../../../../../src/plugins';

	const { data } = $props();
</script>

<Box testid="draggable" plugins={[applyUserSelectHack(data.value)]} default_plugins={[transform()]}
></Box>
