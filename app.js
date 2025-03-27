import express from "express";
import cors from "cors";
import "dotenv/config";
import authRouter from "./routes/api/usersRouter.js";
import dataRouter from "./routes/api/dataRouter.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", authRouter);
app.use("/api/data", dataRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

export default app;
