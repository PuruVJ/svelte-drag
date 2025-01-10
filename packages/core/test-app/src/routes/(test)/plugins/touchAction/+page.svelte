<script>
	import Box from '$lib/Box.svelte';
	import { touchAction } from '../../../../../../src/plugins';

	const { data } = $props();

	const plugins = $derived.by(() => {
		if (data.value === 'undefined') {
			return [touchAction()];
		} else if (data.value === 'null') {
			return [touchAction(null)];
		} else if (data.value === 'false') {
			return [touchAction(false)];
		}

		return [touchAction('auto')];
	});
</script>

<Box testid="draggable" {plugins}></Box>
