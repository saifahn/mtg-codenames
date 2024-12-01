interface RoomsObject {
  [room: string]: {
    [user: string]: boolean
  }
}

const rooms: RoomsObject = {}

interface NoGameState {
  game: null
}

type GameState = NoGameState

const state: GameState = {
  game: null,
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
          if (state.game === null) {
            socket.send(JSON.stringify(state))
          }
        }
      } catch (err) {
        console.log(err)
      }
    },
  },
})
