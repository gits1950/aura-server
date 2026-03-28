const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Serve root folder (NOT public)
app.use(express.static(__dirname));

// Always load index.html from root
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});