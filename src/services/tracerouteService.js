const tracer = spawn("tracert", ["-4", target]); // FORZAR IPV4

let buffer = "";

tracer.stdout.on("data", (data) => {
  buffer += data.toString();
  let lines = buffer.split("\n");
  buffer = lines.pop();

  for (let line of lines) {
    socket.emit("rawLine", line);

    const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);

    if (match) {
      const ip = match[0];



      axios.get(`http://ip-api.com/json/${ip}`)
        .then((geo) => {

          if (geo.data && geo.data.status === "success") {

            socket.emit("hop", {
              ip,
              lat: geo.data.lat,
              lon: geo.data.lon,
              city: geo.data.city,
              country: geo.data.country,
              isp: geo.data.isp,
              org: geo.data.org,
              as: geo.data.as
            });

          }

        })
        .catch(err => {
          console.error("Geo error:", err.message);
        });
    }
  }
});
