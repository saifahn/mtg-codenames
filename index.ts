const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const success = server.upgrade(req);
    if (success) {
      return undefined;
    }

    return new Response('hi');
  },
  websocket: {
    open(ws) {
      console.log('connection opened');
      ws.subscribe('main-room');
      server.publish('main-room', 'message to everyone');
    },
    async message(ws, message) {
      console.log(`Received ${message}`);
      server.publish('main-room', `one of the users said: ${message}`);
    },
  },
});
