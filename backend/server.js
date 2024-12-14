const express = require("express");
const cors = require("cors");
const app = express();
const port = 5001;

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  })
);

app.get("/", (req, res) => {
  res.send("Hello from Express.js backend!");
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
