import express from "express";
import dataController from "../../controllers/dataController.js";

const dataRouter = express.Router();

dataRouter.post("/upload", dataController.uploadMiddleware, dataController.uploadExcel);

dataRouter.get("/", dataController.getData);

dataRouter.patch("/update", dataController.updateData);

export default dataRouter;