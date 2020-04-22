const http = require("http");
const url = require("url");
const WebSocket = require("ws");
const EventEmitter = require("events");

const port = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain");
  res.end("404");
});

let socket;
let timeout;
let delay = 250;
let emitter = new EventEmitter();

(function open() {
  socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
  socket.onopen = () => {
    delay = 250;
    socket.send(`PASS ${process.env.TWITCH_OAUTH_TOKEN}`);
    socket.send(`NICK heloworld`);
    socket.send(`JOIN #nl_kripp`);
  };
  socket.onclose = () => {
    delay *= 2;
    timeout = setTimeout(open, delay + Math.random() * delay);
  };
  socket.onmessage = event => {
    emitter.emit("message", event);
  };
})();

process.on("SIGTERM", () => {
  socket.onclose = null;
  socket.close();
  process.exit(0);
});

const socketServer = new WebSocket.Server({server});

socketServer.on("connection", (socket, request) => {
  const message = event => socket.send(event.data);
  emitter.addListener("message", message);
  socket.on("close", () => emitter.removeListener("message", message));
});

server.listen(port, () => {
  console.log(`Server running at :${port}`);
});
