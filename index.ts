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
    cardsRemaining: {
      uw: goesFirst === 'uw' ? 9 : 8,
      rb: goesFirst === 'rb' ? 9 : 8,
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

// how to handle errors?
function guessCard(position: [number, number], name: string) {
  if (state.game?.status !== 'inProgress') {
    console.error('A card was guessed when there was no game in progress')
    return
  }
  const targetCard = state.game.board[position[0]][position[1]]
  if (targetCard.word !== name) {
    console.error('The card guessed was not the card at the position given')
    return
  }
  if (targetCard.flipped) {
    console.error('The chosen card has already been chosen previously')
    return
  }
  if (targetCard.identity === 'assassin') {
    console.log(
      `The assassin was chosen, ${state.game.currentTurn} has lost the game`
    )
    state.game.status = 'finished'
    state.game.lastAction = 'assassinChosen'
    // server needs to send the new data
    return
  }

  targetCard.flipped = true // this should happen no matter the next handling

  const opposingTeam = state.game.currentTurn === 'uw' ? 'rb' : 'uw'

  if (targetCard.identity === 'neutral') {
    state.game.currentTurn = opposingTeam
    // server needs to send the new data
    return
  }
  if (targetCard.identity !== state.game.currentTurn) {
    state.game.currentTurn = opposingTeam
    state.game.cardsRemaining[opposingTeam] -= 1
    // send a message that can be picked up so we can say: e.g. "uw guessed a rb card!"
    return
  }

  state.game.cardsRemaining[state.game.currentTurn] -= 1
  // send a message that can be picked up "correctly guessed!" or something?
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

        if (action === 'guessCard') {
          if (!state.game) {
            console.error('guess action was received when there was no game')
            return
          }
          console.log('guess was received', parsedMsg.position, parsedMsg.name)
          guessCard(parsedMsg.position, parsedMsg.name)
          server.publish('game', JSON.stringify(state))
        }
      } catch (err) {
        console.log(err)
      }
    },
  },
})
