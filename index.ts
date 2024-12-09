import {
  GameState,
  BoardSpace,
  GameBaseState,
  CardIdentity,
} from './shared/types'

const state: GameState = {
  game: null,
}

const cardnameFiles = Bun.file('./cardlists/mtgo-vintage-cube-nov-2024.txt')
const text = await cardnameFiles.text()
const cardnamesArray = text.trim().split('\n')

/**
 * Takes an array of card names and returns 25 at random
 */
function getRandomCards(requiredNum: number, names: string[]) {
  const cardnames = new Set<string>()

  while (cardnames.size < requiredNum) {
    const randomIndex = Math.floor(Math.random() * names.length)
    cardnames.add(names[randomIndex])
  }

  return [...cardnames]
}

const possibleTeams = ['uw', 'rb'] as const

function createNewGame() {
  const board: BoardSpace[][] = [[], [], [], [], []]
  const cards = getRandomCards(25, cardnamesArray)
  const goesFirst = possibleTeams[Math.floor(Math.random() * 2)]
  const currentTurn = goesFirst

  const cardsByIdentity = {
    uw: goesFirst === 'uw' ? 9 : 8,
    rb: goesFirst === 'rb' ? 9 : 8,
    neutral: 7,
    assassin: 1,
  }

  const availableIdentities: CardIdentity[] = [
    'uw',
    'rb',
    'neutral',
    'assassin',
  ]

  let row = 0

  for (const card of cards) {
    const identity =
      availableIdentities[
        Math.floor(Math.random() * availableIdentities.length)
      ]

    cardsByIdentity[identity] -= 1
    if (cardsByIdentity[identity] < 1) {
      availableIdentities.splice(availableIdentities.indexOf(identity), 1)
    }

    const space: BoardSpace = {
      word: card,
      identity,
      flipped: false,
    }

    board[row].push(space)
    if (board[row].length === 5) {
      row++
    }
  }

  const game: GameBaseState = {
    board,
    goesFirst,
    currentTurn,
    status: 'ready',
    clue: {
      word: '',
      number: null,
    },
  }
  state.game = game
}

function startGame() {
  if (!state.game) {
    console.error('A game start was triggered before a game was created')
    return
  }
  state.game.status = 'inProgress'
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
          server.publish('game', JSON.stringify(state))
        }

        if (action === 'startGame') {
          startGame()
          server.publish('game', JSON.stringify(state))
        }

        if (action === 'submitClue') {
          if (!state.game) {
            console.error('clue action was received when there was no game')
            return
          }
          console.log('clue was received', parsedMsg.clue)
          state.game.clue = parsedMsg.clue
          server.publish('game', JSON.stringify(state))
        }
      } catch (err) {
        console.log(err)
      }
    },
  },
})
