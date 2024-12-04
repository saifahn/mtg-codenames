<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<main>
  <div class="container mx-auto">
    {@render children()}
  </div>
</main>
