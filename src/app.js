const express = require("express");
const helmet = require("helmet");

const app = express(); // 👈 PRIMERO se crea app

app.use(express.json());
app.use(express.static("public"));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdn.socket.io",
          "https://unpkg.com"
        ],
        styleSrc: [
          "'self'",
          "https://unpkg.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://*.tile.openstreetmap.org"
        ],
        connectSrc: ["'self'", "ws:"]
      }
    }
  })
);

// Rutas
const traceRoutes = require("./routes/traceRoutes");
app.use("/api", traceRoutes);

module.exports = app;
