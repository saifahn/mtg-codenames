<script lang="ts">
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import MirranWatermark from '$lib/assets/mirran.svg?raw';
  import PhyrexianWatermark from '$lib/assets/phyrexian.svg?raw';
  import { onMount } from 'svelte';
  import { type GameState } from '../../../shared/types';

  let currentState = $state<
    'loading' | 'noGame' | 'gameWaitingToBeStarted' | 'gameInProgress' | 'gameOver'
  >('loading');
  let gameState = $state<GameState['game']>(null);
  let showingOperativeView = $state(true);

  let ws = $state<WebSocket | null>(null);

  const NUMBER_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '∞'];

  let clueBeingInput = $state('');
  let selectedNumber = $state();

  onMount(() => {
    ws = new WebSocket(PUBLIC_BACKEND_URL);

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

        // TODO: add different messages on each guess for more information

        if (message.game.status === 'finished') {
          currentState = 'gameOver';
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

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!ws) return;
    ws.send(
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

  function guessCard(position: [number, number], name: string) {
    if (!ws) return;
    ws.send(JSON.stringify({ action: 'guessCard', position, name }));
  }

  function passTurn() {
    if (!ws) return;
    ws.send(JSON.stringify({ action: 'passTurn' }));
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
      {#if gameState!.lastAction === 'assassinChosen'}
        <h3 class="text-lg">{gameState?.currentTurn} has chosen the assassin and lost the game!</h3>
      {:else if gameState!.lastAction === 'allOperativesFound'}
        <h3 class="text-lg">
          {gameState?.currentTurn} have found all of their cards and won the game!
        </h3>
      {:else}
        {#if currentState === 'gameWaitingToBeStarted'}
          <h3 class="text-lg">Goes first:</h3>
        {:else}
          <h3 class="text-lg">Current turn:</h3>
        {/if}
        {@html gameState!.currentTurn === 'mirran' ? MirranWatermark : PhyrexianWatermark}
      {/if}
    </div>
    <div class="border p-4">
      <span>{@html MirranWatermark}</span>

      <p>{gameState?.cardsRemaining.mirran} cards to find</p>
    </div>
    <div class="border p-4">
      <span>{@html PhyrexianWatermark}</span>
      <p>{gameState?.cardsRemaining.phyrexian} cards to find</p>
    </div>
    {#if currentState === 'gameInProgress'}
      <div class="border p-4">
        {#if showingOperativeView}
          {#if gameState!.clue.word}
            <h3>Current clue:</h3>
            <p class="text-lg capitalize">{gameState!.clue.word} {gameState!.clue.number}</p>
            <button
              class="mt-2 rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
              onclick={passTurn}
            >
              Pass turn
            </button>
          {:else}
            <h3 class="text-lg">Waiting for clue</h3>
          {/if}
        {:else if !gameState!.clue.word}
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
          <p class="text-lg capitalize">{gameState!.clue.word} {gameState!.clue.number}</p>
        {/if}
      </div>
    {/if}
  </div>
  <div class="grid grid-cols-5 gap-2">
    {#each gameState!.board as row, rowIndex}
      {#each row as space, colIndex}
        <div class="rounded-lg border border-slate-200 p-8 hover:border-slate-400">
          <h4 class="mb-2 font-semibold">{space.word}</h4>
          {#if space.flipped || !showingOperativeView}
            <p>belongsTo: {space.identity}</p>
          {/if}
          {#if gameState!.status === 'inProgress' && gameState!.clue.word && showingOperativeView && !space.flipped}
            <button
              class="mt-2 rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
              onclick={() => guessCard([rowIndex, colIndex], space.word)}
            >
              Guess card
            </button>
          {/if}
        </div>
      {/each}
    {/each}
  </div>
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
