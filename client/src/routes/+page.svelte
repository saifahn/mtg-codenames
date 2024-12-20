<script lang="ts">
  import MirranWatermark from '$lib/assets/mirran.svg?raw';
  import PhyrexianWatermark from '$lib/assets/phyrexian.svg?raw';
  import { onMount } from 'svelte';
  import { gameState, getWsConnection } from '$lib/gameState.svelte';
  import Board from '$lib/board.svelte';

  let isLoading = $state(true);
  let showingOperativeView = $state(true);
  let wsConnection: WebSocket | undefined = $state();

  const NUMBER_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '∞'];

  let clueBeingInput = $state('');
  let selectedNumber = $state();

  onMount(() => {
    wsConnection = getWsConnection();
    isLoading = false;
  });

  function createNewGame() {
    if (!wsConnection) return;
    wsConnection.send(JSON.stringify({ action: 'createNewGame' }));
  }

  function startGame() {
    if (!wsConnection) return;
    wsConnection.send(JSON.stringify({ action: 'startGame' }));
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!wsConnection) return;
    wsConnection.send(
      JSON.stringify({
        action: 'submitClue',
        clue: {
          word: clueBeingInput,
          number: selectedNumber
        }
      })
    );
    selectedNumber = '0';
    clueBeingInput = '';
  }

  function passTurn() {
    if (!wsConnection) return;
    wsConnection.send(JSON.stringify({ action: 'passTurn' }));
  }
</script>

{#if isLoading}
  <p>Loading...</p>
{:else if gameState.game === null}
  <div class="mb-4 flex items-center gap-2 bg-slate-200 p-4 dark:bg-slate-700">
    <p class="flex-grow">
      There is no game currently in progress. Would you like to create a new game?
    </p>
    <button
      class="rounded-md bg-sky-200 px-4 py-2 hover:bg-sky-300 active:bg-sky-100 dark:bg-sky-700 dark:hover:bg-sky-800 dark:active:bg-sky-600"
      onclick={createNewGame}>Create game</button
    >
  </div>
{:else}
  {#if gameState.game.status === 'ready'}
    <div class="mb-4 flex items-center gap-2 bg-slate-200 p-4 dark:bg-slate-700">
      <p class="flex-grow">There is a game waiting to be started. Would you like to begin?</p>
      <button
        onclick={startGame}
        class="rounded-md bg-sky-200 px-4 py-2 hover:bg-sky-300 active:bg-sky-100 dark:bg-sky-700 dark:hover:bg-sky-800 dark:active:bg-sky-600"
      >
        Start game
      </button>
    </div>
  {/if}
  <div class="mb-3 flex gap-4">
    <div class="border p-4">
      {#if gameState.game.lastAction === 'assassinChosen'}
        <h3 class="text-lg">
          {gameState.game.currentTurn} has chosen the assassin and lost the game
        </h3>
      {:else if gameState.game.lastAction === 'allOperativesFound'}
        <h3 class="text-lg">
          {gameState.game.currentTurn} have found all of their cards and won the game
        </h3>
      {:else}
        {#if gameState.game.status === 'ready'}
          <h3 class="text-lg">Goes first:</h3>
        {:else}
          <h3 class="text-lg">Current turn:</h3>
        {/if}
        {@html gameState.game.currentTurn === 'mirran' ? MirranWatermark : PhyrexianWatermark}
      {/if}
    </div>
    <div class="border p-4">
      <span>{@html MirranWatermark}</span>

      <p>{gameState.game.cardsRemaining.mirran} cards to find</p>
    </div>
    <div class="border p-4">
      <span>{@html PhyrexianWatermark}</span>
      <p>{gameState.game.cardsRemaining.phyrexian} cards to find</p>
    </div>
    {#if gameState.game.status === 'inProgress'}
      <div class="border p-4">
        {#if showingOperativeView}
          {#if gameState.game.clue.word}
            <h3>Current clue:</h3>
            <p class="text-lg capitalize">
              {gameState.game.clue.word}
              {gameState.game.clue.number}
            </p>
            <button
              class="mt-2 rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
              onclick={passTurn}
            >
              Pass turn
            </button>
          {:else}
            <h3 class="text-lg">Waiting for clue</h3>
          {/if}
        {:else if !gameState.game.clue.word}
          <h3 class="text-lg">Waiting for your clue</h3>
          <form class="mt-2" onsubmit={handleSubmit}>
            <input
              type="text"
              class="rounded-lg border border-slate-200 bg-transparent p-2"
              placeholder="Enter your clue"
              bind:value={clueBeingInput}
            />
            <select
              class="focus:shadow-outline inline appearance-none rounded-lg border border-slate-200 bg-transparent px-4 py-2 pr-8 hover:border-slate-300 focus:outline-none"
              bind:value={selectedNumber}
            >
              {#each NUMBER_OPTIONS as number}
                <option>{number}</option>
              {/each}
            </select>
            <button
              class="mt-2 rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
            >
              Submit
            </button>
          </form>
        {:else}
          <h3>Current clue:</h3>
          <p class="text-lg capitalize">{gameState.game.clue.word} {gameState.game.clue.number}</p>
        {/if}
      </div>
    {/if}
  </div>
  <Board spymasterView={!showingOperativeView} />
  <div class="mt-4 flex gap-2">
    <button
      class="rounded border border-rose-600 px-4 py-2 text-rose-300 hover:border-rose-700 hover:text-rose-400 active:border-rose-500"
      onclick={createNewGame}>Reset and create new game</button
    >
    <button
      class="rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
      onclick={() => (showingOperativeView = !showingOperativeView)}
    >
      Switch to {showingOperativeView ? 'Spymaster' : 'Operative'} view
    </button>
  </div>
{/if}
