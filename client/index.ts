const exampleSocket = new WebSocket('ws://localhost:3000');

exampleSocket.onopen = (event) => {
  console.log('opened, connecting');
  exampleSocket.send('testing sending some text');
};

console.log(exampleSocket.readyState);

exampleSocket.onmessage = (event) => console.log(event.data);
