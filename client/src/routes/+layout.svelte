<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<main class="min-h-screen py-8 dark:bg-slate-800 dark:text-slate-100">
  <div class="container mx-auto">
    {@render children()}
  </div>
</main>
