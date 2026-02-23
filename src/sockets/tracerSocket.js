const { spawn } = require("child_process");
const axios = require("axios");
const dns = require("dns");

module.exports = (io) => {

  io.on("connection", (socket) => {
    console.log("Cliente conectado");

    socket.on("startTraceroute", (target) => {

      if (!/^[a-zA-Z0-9.-]+$/.test(target)) {
        return socket.emit("errorMessage", "Target inválido");
      }

      socket.emit("status", "Resolviendo dominio...");

      // Reset por ejecución
      let hopNumber = 0;
      const seenIps = new Set();

      dns.lookup(target, { family: 4 }, (err, address) => {

        if (err || !address) {
          console.error("Error DNS:", err);
          return socket.emit("errorMessage", "No se pudo resolver IPv4");
        }

        console.log("IPv4 detectada:", address);
        socket.emit("status", `Iniciando traceroute a ${address}...`);

        const tracer = spawn("tracert", [address]);

        let buffer = "";

        tracer.stdout.on("data", async (data) => {

          buffer += data.toString();
          let lines = buffer.split("\n");
          buffer = lines.pop();

          for (let line of lines) {

            const cleanLine = line.trim();
            if (!cleanLine) continue;

            socket.emit("rawLine", cleanLine);

            const match = cleanLine.match(/(\d+\.\d+\.\d+\.\d+)/);

            if (match) {

              const ip = match[0];

              // Evitar repetir IP
              if (seenIps.has(ip)) continue;
              seenIps.add(ip);

              hopNumber++;

              try {

                const response = await axios.get(
                  `http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon,isp,org,as,asname,reverse,query`
                );

                if (response.data.status === "success") {

                  socket.emit("hop", {
                    hop: hopNumber,
                    ip: response.data.query,
                    lat: response.data.lat,
                    lon: response.data.lon,
                    city: response.data.city,
                    country: response.data.country,
                    isp: response.data.isp,
                    org: response.data.org,
                    as: response.data.as,
                    asname: response.data.asname,
                    reverse: response.data.reverse
                  });

                }

              } catch (error) {
                console.error("Geo/Whois error:", error.message);
              }
            }
          }
        });

        tracer.stderr.on("data", (data) => {
          console.error("Traceroute error:", data.toString());
        });

        tracer.on("close", () => {
          console.log("Traceroute terminado");
          socket.emit("status", "Traceroute terminado");
          socket.emit("done");
        });

      });

    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado");
    });

  });

};