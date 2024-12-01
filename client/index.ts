const ws = new WebSocket('ws://localhost:3000')

ws.onopen = () => {
  console.log('connected to server')
  const username = prompt('What is your username?')
  const loginRequestMessage = {
    action: 'login',
    username,
  }
  ws.send(JSON.stringify(loginRequestMessage))
}

ws.onmessage = (event) => {
  if (typeof event.data !== 'string') {
    console.log('received an unexpected Buffer')
    return
  }
  const serverState = JSON.parse(event.data)
  if (serverState.game === null) {
    console.log('There is no game in progress')
  }
}

ws.onclose = (event) => {
  console.log('connection to server closed')
}
