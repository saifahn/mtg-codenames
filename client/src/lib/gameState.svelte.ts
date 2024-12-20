import { PUBLIC_BACKEND_URL } from '$env/static/public';
import type { GameState } from '../../../shared/types';

let wsConnection: WebSocket | undefined = $state();
export const gameState: GameState = $state({ game: null });

export function getGameState() {
  return gameState;
}

function isGameState(jsonParsed: unknown): jsonParsed is GameState {
  if (!(typeof jsonParsed === 'object' && !!jsonParsed && 'game' in jsonParsed)) {
    return false;
  }
  return jsonParsed.game !== undefined;
}

function makeNewConnection() {
  if (wsConnection) {
    console.log('connection already exists, skipping');
    return;
  }
  wsConnection = new WebSocket(PUBLIC_BACKEND_URL);

  wsConnection.onopen = () => {
    console.log('connected to server');
    const loginRequestMessage = {
      action: 'login',
      username: 'svelteKit'
    };
    wsConnection!.send(JSON.stringify(loginRequestMessage));
  };

  wsConnection.onmessage = (event) => {
    if (typeof event.data !== 'string') {
      console.log('received an unexpected Buffer');
      return;
    }

    // TODO: validate with a package like zod?
    const message = JSON.parse(event.data);

    if (isGameState(message)) {
      // TODO: add different messages on each guess for more information
      gameState.game = message.game;
    }
  };

  wsConnection.onclose = () => {
    console.log('connection to server closed');
  };
}

export function getWsConnection() {
  if (!wsConnection) {
    makeNewConnection();
  }
  return wsConnection;
}
