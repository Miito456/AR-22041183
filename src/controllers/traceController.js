exports.runTraceroute = (req, res) => {
    const { target } = req.body;

    if (!target) {
        return res.status(400).json({ error: "Target requerido" });
    }

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    tracerouteService.traceStream(
        target,
        (data) => {
            res.write(data); // envía línea por línea
        },
        () => {
            res.end(); // termina cuando finaliza
        }
    );
};
