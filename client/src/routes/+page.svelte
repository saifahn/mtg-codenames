<script lang="ts">
  import AzoriusWatermark from '$lib/assets/azorius.svg?raw';
  import RakdosWatermark from '$lib/assets/rakdos.svg?raw';
  import { onMount } from 'svelte';
  import { type GameState } from '../../../shared/types';

  let currentState = $state<'loading' | 'noGame' | 'gameWaitingToBeStarted' | 'gameInProgress'>(
    'loading'
  );
  let ws = $state<WebSocket | null>(null);

  let gameState = $state<GameState['game']>(null);

  onMount(() => {
    ws = new WebSocket('ws://localhost:3000');

    if (!ws) return;

    ws.onopen = () => {
      console.log('connected to server');
      const loginRequestMessage = {
        action: 'login',
        username: 'svelteKit'
      };
      ws!.send(JSON.stringify(loginRequestMessage));
    };

    function isGameState(jsonParsed: unknown): jsonParsed is GameState {
      if (!(typeof jsonParsed === 'object' && !!jsonParsed && 'game' in jsonParsed)) {
        return false;
      }
      return jsonParsed.game !== undefined;
    }

    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        console.log('received an unexpected Buffer');
        return;
      }

      // TODO: validate with a package like zod?
      const message = JSON.parse(event.data);

      if (isGameState(message)) {
        if (message.game === null) {
          currentState = 'noGame';
          return;
        }

        if (message.game.status === 'ready') {
          currentState = 'gameWaitingToBeStarted';
        }

        if (message.game.status === 'inProgress') {
          currentState = 'gameInProgress';
        }
        gameState = message.game;
      }
    };

    ws.onclose = () => {
      console.log('connection to server closed');
    };
  });

  function createNewGame() {
    if (!ws) return;
    ws.send(JSON.stringify({ action: 'createNewGame' }));
  }

  function startGame() {
    if (!ws) return;
    ws.send(JSON.stringify({ action: 'startGame' }));
  }
</script>

{#if currentState === 'loading'}
  <p>Loading...</p>
{:else if currentState === 'noGame'}
  <div class="mb-4 flex items-center gap-2 p-4 dark:bg-slate-700 dark:shadow-slate-300">
    <p class="flex-grow">
      There is no game currently in progress. Would you like to create a new game?
    </p>
    <button
      class="rounded-md bg-sky-700 px-4 py-2 hover:bg-sky-800 active:bg-sky-600"
      onclick={createNewGame}>Create game</button
    >
  </div>
{:else}
  {#if currentState === 'gameWaitingToBeStarted'}
    <div class="mb-4 flex items-center gap-2 p-4 dark:bg-slate-700 dark:shadow-slate-300">
      <p class="flex-grow">There is a game waiting to be started. Would you like to begin?</p>
      <button
        onclick={startGame}
        class="rounded-md bg-sky-700 px-4 py-2 hover:bg-sky-800 active:bg-sky-600"
      >
        Start game
      </button>
    </div>
  {/if}
  <div class="mb-3 flex gap-4">
    <div class="border p-4">
      {#if currentState === 'gameWaitingToBeStarted'}
        <h3 class="text-lg">Goes first:</h3>
      {:else}
        <h3 class="text-lg">Current turn:</h3>
      {/if}
      {@html gameState!.currentTurn === 'rb' ? RakdosWatermark : AzoriusWatermark}
    </div>
    <div class="border p-4">
      {@html RakdosWatermark}
      <p>9 cards to find</p>
    </div>
    <div class="border p-4">
      {@html AzoriusWatermark}
      <p>8 cards to find</p>
    </div>
  </div>
  <div class="grid grid-cols-5 gap-2">
    {#each gameState!.board as row}
      {#each row as space}
        <div class="rounded-lg border border-slate-200 p-8 hover:border-slate-400">
          <h4 class="mb-2 font-semibold">{space.word}</h4>
          <p>flipped: {space.flipped}</p>
          <p>belongsTo: {space.identity}</p>
        </div>
      {/each}
    {/each}
  </div>
  <div class="mt-4">
    <button
      class="rounded-md bg-rose-700 px-4 py-2 hover:bg-rose-800 active:bg-rose-600"
      onclick={createNewGame}>Reset and create new game</button
    >
  </div>
{/if}
