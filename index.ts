interface RoomsObject {
  [room: string]: {
    [user: string]: boolean;
  };
}

const rooms: RoomsObject = {};

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
    open() {
      console.log('connection opened');
    },
    async message(socket, message) {
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
        if (type === 'joinRoom') {
          const { room, username } = parsedMsg;
          if (!rooms[room]) {
            rooms[room] = {};
          }
          if (!rooms[room][username]) {
            rooms[room][username] = true;
          }
          console.log(rooms);
          server.publish(
            room,
            `broadcasting to users in ${room}: ${username} has joined`
          );
          socket.subscribe(room);
          console.log(`LOGGING: ${username} has joined ${room}`);
          socket.send(`You have joined ${room}`);
        }
      } catch (err) {
        console.log(err);
      }
    },
  },
});
