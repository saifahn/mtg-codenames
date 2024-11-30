const exampleSocket = new WebSocket('ws://localhost:3000');

exampleSocket.onopen = (event) => {
  console.log('connection to server opened');
  exampleSocket.send('Hi server from client 2');
};

exampleSocket.onmessage = (event) => {
  console.log(`message from server: ${event.data}`);
};

exampleSocket.onclose = (event) => {
  console.log('connection to server closed');
};
