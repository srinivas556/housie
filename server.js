const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static files
app.use(express.static(path.join(__dirname, "public")));

let rooms = {};

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Socket.io communication
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("create-room", ({ roomCode, playerName }) => {
    rooms[roomCode] = { players: {}, organizer: playerName };
    rooms[roomCode].players[socket.id] = playerName;
    socket.join(roomCode);
    console.log(`Room created: ${roomCode} by ${playerName}`);
    io.to(socket.id).emit("room-joined", roomCode);
  });

  socket.on("join-room", ({ roomCode, playerName }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].players[socket.id] = playerName;
      socket.join(roomCode);
      console.log(`User ${playerName} joined room: ${roomCode}`);
      io.to(socket.id).emit("room-joined", roomCode);
    } else {
      io.to(socket.id).emit("error", "Room not found");
    }
  });

  socket.on("generate-number", ({ room, number }) => {
    console.log(`Number generated in room ${room}: ${number}`);
    io.to(room).emit("new-number", number);
  });

  socket.on("row-completed", ({ room, playerName, rowIndex }) => {
    console.log(`${playerName} completed row ${rowIndex + 1} in room ${room}`);
    io.to(room).emit("row-completed", { playerName, rowIndex });
  });

  socket.on("game-completed", ({ room, playerName }) => {
    console.log(`${playerName} won the game in room ${room}`);
    io.to(room).emit("game-completed", playerName);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    for (const roomCode in rooms) {
      if (rooms[roomCode].players[socket.id]) {
        delete rooms[roomCode].players[socket.id];
        if (Object.keys(rooms[roomCode].players).length === 0) {
          delete rooms[roomCode];
        }
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
