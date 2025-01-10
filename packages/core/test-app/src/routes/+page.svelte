<script>
	import { routes } from '$lib/ROUTES';
</script>

{#each routes as route}
	<a href={route}>{route}</a>
	<br />
{/each}
