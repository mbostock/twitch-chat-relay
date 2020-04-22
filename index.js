const http = require("http");
const ws = require("ws");

const port = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain");
  res.end("404");
});

const socketServer = new ws.Server({server});

socketServer.on("connection", connection => {
  connection.on("message", message => console.log("received: %s", message));
  connection.send("hello");
});

server.listen(port, () => {
  console.log(`Server running at :${port}`);
});
