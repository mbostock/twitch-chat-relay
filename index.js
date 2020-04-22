const http = require("http");
const url = require("url");
const WebSocket = require("ws");
const EventEmitter = require("events");

const port = process.env.PORT || 5000;

const channels = process.env.TWITCH_CHANNELS.split(",");

let socket;
let timeout;
let delay = 250;
let emitter = new EventEmitter();

(function open() {
  socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
  socket.onopen = () => {
    delay = 250;
    socket.send(`PASS ${process.env.TWITCH_OAUTH_TOKEN}`);
    socket.send(`NICK ${process.env.TWITCH_NICK}`);
    for (const channel of channels) socket.send(`JOIN #${channel}`);
  };
  socket.onclose = () => {
    delay *= 2;
    timeout = setTimeout(open, delay + Math.random() * delay);
  };
  socket.onmessage = event => {
    emitter.emit("message", parseMessage(event.data));
  };
})();

function parseMessage(message) {
  const i = message.indexOf(" ");
  const j = message.indexOf(" ", i + 1);
  const k = message.indexOf(" ", j + 1);
  return {
    user: message.slice(1, message.indexOf("!")),
    type: message.slice(i + 1, j),
    channel: message.slice(j + 2, k),
    message: message.slice(k + 2, -2)
  };
}

process.on("SIGTERM", () => {
  socket.onclose = null;
  socket.close();
  process.exit(0);
});

const server = http.createServer((req, res) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain");
  res.end("404");
});

const socketServer = new WebSocket.Server({server});

socketServer.on("connection", (socket, request) => {
  const {pathname} = url.parse(request.url);
  const channel = pathname.slice(1);
  if (!channels.includes(channel)) return void socket.terminate();
  const message = message => {
    if (message.channel === channel) {
      socket.send(JSON.stringify(message));
    }
  };
  emitter.addListener("message", message);
  socket.on("close", () => emitter.removeListener("message", message));
});

server.listen(port, () => {
  console.log(`Server running at :${port}`);
});
