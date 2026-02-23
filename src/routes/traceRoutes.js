const express = require("express");
const router = express.Router();
const { runTraceroute } = require("../controllers/traceController");

router.post("/traceroute", runTraceroute);

module.exports = router;
