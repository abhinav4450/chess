const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const app = express();
const PORT = 3000;
const server = http.createServer(app);
const io = socketIo(server);
const chess = new Chess();
let player = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.static(path.join(__dirname, "../frontend/public")));

app.get("/", (req, res) => {
  res.render("index");
});

io.on("connection", (socket) => {
  console.log("Connected");

  if (!player.white) {
    player.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!player.black) {
    player.black = socket.id;
    socket.emit("playerRole", "b");
} else {
    socket.emit("spectatorRole");
  }
  socket.on("disconnect", (socket) => {
    if (socket.id === player.white) {
      delete player.white;
    } else if (socket.id === player.black) {
      delete player.black;
    }
  });
 
  socket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && socket.id !== player.white) return;
      if (chess.turn() === "b" && socket.id !== player.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move",move);
        io.emit("boardState",chess.fen());
      }else{
        console.log("Invalid Move :",move);
        socket.emit("Invalid Move",move);
      }
    } catch (err) {
      console.log(err);
      socket.emit("Invalid Move: ",move);
    }
  });
});

server.listen(PORT, () => {
  console.log("The server is running on Port ", PORT);
});
