require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

require("./src/sockets/tracerSocket")(io);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
