require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001; // Render использует process.env.PORT

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Бэкенд работает!");
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
