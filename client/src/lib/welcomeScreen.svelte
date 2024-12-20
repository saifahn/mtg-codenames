<script lang="ts">
  import { createNewGame } from './gameState.svelte';
</script>

<div class="mb-4 flex items-center gap-2 bg-slate-200 p-4 dark:bg-slate-700">
  <p class="flex-grow">
    There is no game currently in progress. Would you like to create a new game?
  </p>
  <button
    class="rounded-md bg-sky-200 px-4 py-2 hover:bg-sky-300 active:bg-sky-100 dark:bg-sky-700 dark:hover:bg-sky-800 dark:active:bg-sky-600"
    onclick={createNewGame}>Create game</button
  >
</div>
