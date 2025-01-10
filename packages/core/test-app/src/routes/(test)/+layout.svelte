<script lang="ts">
	import { on } from 'svelte/events';

	const { children } = $props();

	function handlers(e: PointerEvent) {
		// @ts-expect-error This is hacky
		window.mouseX = e.clientX;
		// @ts-expect-error This is hacky
		window.mouseY = e.clientY;
	}

	$effect(() => {
		const controller = new AbortController();

		on(document, 'pointerup', handlers, { signal: controller.signal });
		on(document, 'pointermove', handlers, { signal: controller.signal });
		on(document, 'pointerdown', handlers, { signal: controller.signal });

		return () => controller.abort();
	});
</script>

{@render children()}

<style>
	:global {
		body {
			margin: 0;
		}
	}
</style>
