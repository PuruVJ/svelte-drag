<script lang="ts">
	import Box from '$lib/Box.svelte';
	import { ControlFrom, controls } from '../../../../../../src/plugins';

	const { data } = $props();

	const plugin_args = $derived.by<Parameters<typeof controls>[0]>(() => {
		if (data.type === 'undefined,null') {
			return undefined;
		} else if (data.type === 'allow-only') {
			return { allow: ControlFrom.selector('.handle') };
		} else if (data.type === 'block-only') {
			return { block: ControlFrom.selector('.cancel') };
		} else if (data.type === 'allow-block') {
			return {
				allow: ControlFrom.selector('.handle'),
				block: ControlFrom.selector('.cancel'),
			};
		} else if (data.type === 'allow-block-allow') {
			return {
				allow: ControlFrom.selector('.handle, .handle2'),
				block: ControlFrom.selector('.cancel'),
				priority: 'allow',
			};
		} else if (data.type === 'block-allow-block') {
			return {
				allow: ControlFrom.selector('.middle-handle'),
				block: ControlFrom.selector('.outer-handle, .inner-handle'),
				priority: 'block',
			};
		}
	});

	let is_mounted = $state(false);
	$effect(() => {
		is_mounted = true;
	});
</script>

{#if is_mounted}
	<Box testid="draggable" plugins={[controls(plugin_args)]}>
		{#if data.type === 'allow-block'}
			<div class="handle">
				Handle
				<br /><br />
				<div class="cancel">Cancel</div>
			</div>
		{:else if data.type === 'allow-block-allow'}
			<div class="handle">
				<span class="handle-text"> Handle </span>

				<div class="cancel">
					<span class="cancel-text">Cancel</span>

					<div class="handle2">Handle2</div>
				</div>
			</div>
		{:else if data.type === 'block-allow-block'}
			<div class="outer-handle">
				<span class="outer-text">Outer Block</span>

				<div class="middle-handle">
					<span class="middle-text">Middle Allow</span>

					<div class="inner-handle">
						<span class="inner-text">Inner Block</span>
					</div>
				</div>
			</div>
		{:else}
			<div class="handle">Handle</div>
			<div class="cancel">Cancel</div>
		{/if}
	</Box>
{/if}

<style>
</style>
