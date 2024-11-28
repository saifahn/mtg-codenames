const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const success = server.upgrade(req);
    if (success) {
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    return new Response('hi');
  },
  websocket: {
    open() {
      console.log('connection opened');
    },
    async message(ws, message) {
      console.log(`Received ${message}`);
      ws.send(`You said: ${message}`);
    },
  },
});
