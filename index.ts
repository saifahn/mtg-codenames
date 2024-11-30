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
    },
    async message(ws, message) {
      if (typeof message !== 'string') {
        console.log('server only accepts strings');
        return;
      }

      try {
        const parsedMsg = JSON.parse(message);
        const { type } = parsedMsg;
        if (type === 'login') {
          console.log(`${parsedMsg.username} has logged in`);
        }
      } catch (err) {
        console.log(err);
      }
    },
  },
});
