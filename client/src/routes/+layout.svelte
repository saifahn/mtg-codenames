<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<main class="dark:bg-slate-800 h-screen dark:text-slate-100">
	<div class="container mx-auto">
		{@render children()}
	</div>
</main>
