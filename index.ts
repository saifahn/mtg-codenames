interface RoomsObject {
  [room: string]: {
    [user: string]: boolean
  }
}

const rooms: RoomsObject = {}

interface NoGameState {
  game: null
}

type Team = 'Azorius' | 'Rakdos'

interface BoardSpace {
  word: string
  identity: Team | 'assassin' | 'neutral'
  flipped: boolean
}

interface GameBaseState {
  board: BoardSpace[][]
  turn: Team
  goesFirst: Team
  currentTurn: Team
  status: 'ready' | 'inProgress' | 'finished'
  // add users
}

export type GameState = NoGameState | { game: GameBaseState }

const state: GameState = {
  game: null,
}

function createNewGame() {
  // load words
  // split
  // choose 25 at random
  // load them into the board
  // choose which team goesFirst
  // set current turn to that team
  // set status to ready

  const game: GameBaseState = {
    status: 'ready',
  }
  state.game = game
}

function startGame() {
  const game: GameBaseState = {
    status: 'inProgress',
  }
  state.game = game
}

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const success = server.upgrade(req)
    if (success) {
      return undefined
    }

    return new Response('hi')
  },
  websocket: {
    open(socket) {
      console.log('connection opened')
      socket.subscribe('game')
    },
    close(socket) {
      console.log('a connection was closed')
      socket.unsubscribe('game')
    },
    async message(socket, message) {
      if (typeof message !== 'string') {
        console.log('server only accepts strings')
        return
      }

      try {
        const parsedMsg = JSON.parse(message)
        const { action } = parsedMsg

        if (action === 'login') {
          console.log(`LOG: ${parsedMsg.username} has logged in`)
          socket.send(JSON.stringify(state))
        }

        if (action === 'createNewGame') {
          createNewGame()
          socket.send('GAME_CREATED')
        }

        if (action === 'startGame') {
          startGame()
          server.publish('game', 'GAME_STARTED')
        }
      } catch (err) {
        console.log(err)
      }
    },
  },
})
