const socket = io();

// DOM Elements
const playerNameInput = document.getElementById("player-name");
const roomCodeInput = document.getElementById("room-code");
const joinRoomButton = document.getElementById("join-room");
const createRoomButton = document.getElementById("create-room");
const gameSection = document.getElementById("game-section");
const roomIdElement = document.getElementById("room-id");
const generateNumberButton = document.getElementById("generate-number");
const currentNumberElement = document.getElementById("current-number");
const playerGrid = document.getElementById("player-grid");
const notifications = document.getElementById("notifications");

let roomCode = "";
let playerName = "";
let playerGridData = [];
let generatedNumbers = [];

// Utility to create a random grid
function generateGrid() {
  const numbers = Array.from({ length: 50 }, (_, i) => i + 1);
  const shuffledNumbers = numbers.sort(() => Math.random() - 0.5);
  return shuffledNumbers.slice(0, 25).map((n, i) => ({
    number: n,
    crossed: false,
    index: i,
  }));
}

// Render the player's grid
function renderGrid() {
  playerGrid.innerHTML = "";
  playerGridData.forEach((cell, index) => {
    const cellElement = document.createElement("div");
    cellElement.classList.add("cell");
    if (cell.crossed) {
      cellElement.classList.add("crossed");
    }
    cellElement.textContent = cell.number;
    cellElement.addEventListener("click", () => toggleCell(index));
    playerGrid.appendChild(cellElement);
  });
}

// Toggle a cell when clicked
function toggleCell(index) {
  playerGridData[index].crossed = !playerGridData[index].crossed;
  renderGrid();
}

// Show a notification
function showNotification(message, color = "#28a745") {
  notifications.textContent = message;
  notifications.style.color = color;
  setTimeout(() => {
    notifications.textContent = "";
  }, 3000);
}

// Handle room joining
function joinRoom() {
  playerName = playerNameInput.value.trim();
  roomCode = roomCodeInput.value.trim();
  if (playerName && roomCode) {
    socket.emit("join-room", { roomCode, playerName });
  } else {
    showNotification("Please enter a valid name and room code.", "red");
  }
}

// Handle room creation
function createRoom() {
  playerName = playerNameInput.value.trim();
  roomCode = roomCodeInput.value.trim();
  if (playerName && roomCode) {
    socket.emit("create-room", { roomCode, playerName });
  } else {
    showNotification("Please enter a valid name and room code.", "red");
  }
}

// Generate a random number
function generateNumber() {
  const availableNumbers = Array.from({ length: 50 }, (_, i) => i + 1).filter(
    (n) => !generatedNumbers.includes(n)
  );
  if (availableNumbers.length > 0) {
    const randomNumber =
      availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    generatedNumbers.push(randomNumber);
    socket.emit("generate-number", { room: roomCode, number: randomNumber });
  } else {
    showNotification("All numbers have been generated!", "red");
  }
}

// Event listeners
joinRoomButton.addEventListener("click", joinRoom);
createRoomButton.addEventListener("click", createRoom);
generateNumberButton.addEventListener("click", generateNumber);

// Socket event handlers
socket.on("room-joined", (room) => {
  roomCode = room;
  roomIdElement.textContent = `Room Code: ${roomCode}`;
  gameSection.style.display = "block";
  playerGridData = generateGrid();
  renderGrid();
});

socket.on("new-number", (number) => {
  currentNumberElement.textContent = `Current Number: ${number}`;
  const matchedCell = playerGridData.find((cell) => cell.number === number);
  if (matchedCell) {
    matchedCell.crossed = true;
    renderGrid();
    showNotification(`You got a match: ${number}!`);
  }
});

socket.on("row-completed", ({ playerName, rowIndex }) => {
  showNotification(`${playerName} completed row ${rowIndex + 1}!`, "blue");
});

socket.on("game-completed", (winnerName) => {
  showNotification(`${winnerName} won the game!`, "gold");
});

socket.on("error", (message) => {
  showNotification(message, "red");
});
