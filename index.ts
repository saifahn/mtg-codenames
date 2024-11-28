console.log("Hello via Bun!");

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("hi");
  },
});

console.log(`Server started, listening on http:localhost:${server.port}...`);
