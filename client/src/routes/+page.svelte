<script lang="ts">
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

      if (event.data === 'GAME_CREATED') {
        alert('The game has been created');
        // gameState = message.game;
        return;
      }

      if (event.data === 'GAME_STARTED') {
        alert('The game has started');
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
    console.log('createNewGame called');
    if (!ws) return;
    console.log('send the action of creating a new game');
    ws.send(JSON.stringify({ action: 'createNewGame' }));
  }
</script>

<h1 class="pt-4 text-xl">Welcome to Cardnames</h1>
{#if currentState === 'loading'}
  <p>Loading...</p>
{:else if currentState === 'noGame'}
  <p>There is no game currently in progress. Would you like to create a new game?</p>
  <button onclick={createNewGame}>Create game</button>
{:else if currentState === 'gameWaitingToBeStarted'}
  <p>There is a game waiting to be started. Would you like to begin?</p>
  <h2 class="py-4 text-xl">Game details:</h2>
  <h3 class="py-2 text-lg">Board:</h3>
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
  <h3 class="py-2 text-lg">Team that goes first:</h3>
  <p>{gameState!.goesFirst}</p>
  <h3 class="py-2 text-lg">Team whose turn it is:</h3>
  <p>{gameState!.currentTurn}</p>
{:else if currentState === 'gameInProgress'}
  <p>The game is in progress. Here is the game board:</p>
{/if}
