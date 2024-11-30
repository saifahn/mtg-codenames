const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('connected to server');
  const username = prompt('What is your username?');
  const loginRequestMessage = {
    type: 'login',
    username,
  };
  ws.send(JSON.stringify(loginRequestMessage));

  const room = prompt('What room would you like to join?');
  const roomRequestMessage = {
    type: 'joinRoom',
    username,
    room,
  };
  ws.send(JSON.stringify(roomRequestMessage));
};

ws.onmessage = (event) => {
  console.log(`message from server: ${event.data}`);
};

ws.onclose = (event) => {
  console.log('connection to server closed');
};
