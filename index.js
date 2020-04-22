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
    socket.send(`CAP REQ :twitch.tv/tags`);
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

function parseMessage(data) {
  let i = 0, j;
  let tags;
  let user;
  let type;
  let channel;
  let message;
  if (data[0] === "@") j = data.indexOf(" ", i), tags = parseTags(data.slice(i + 1, j)), i = j + 1;
  j = data.indexOf(" ", i), user = data.slice(i + 1, data.indexOf("!", i)), i = j + 1;
  j = data.indexOf(" ", i), type = data.slice(i, j), i = j + 1;
  j = data.indexOf(" ", i), channel = data.slice(i + 1, j), i = j + 1;
  j = data.indexOf(" ", i), message = data.slice(i + 1, -2);
  return {
    tags,
    user,
    type,
    channel,
    message
  };
}

function parseTags(data) {
  return Object.fromEntries(data.split(";").map(d => d.split(/=/)));
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
