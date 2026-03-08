<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { setStorage, getStorage } from '$lib/storage.js';
	import { initDevData } from '$lib/dev-data.js';

	let { children } = $props();

	onMount(async () => {
		const devData = initDevData({ getStorage, setStorage });
		await devData.setup();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
