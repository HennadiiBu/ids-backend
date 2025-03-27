import multer from "multer";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import DataModel from "../models/data.js";
import ctrlWrapper from "../decorators/ctrlWrapper.js";

const upload = multer({ dest: "uploads/" });

const uploadExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  fs.unlinkSync(filePath);

  await DataModel.deleteMany();
  const insertedData = await DataModel.insertMany(data);

  res.json({ message: "Data uploaded successfully", data: insertedData });
};

const getData = async (req, res) => {
  const filters = req.query;
  const data = await DataModel.find(filters);
  res.json(data);
};

const updateData = async (req, res) => {
  const { id, updatedFields } = req.body;
  const updatedData = await DataModel.findByIdAndUpdate(id, updatedFields, { new: true });
  res.json(updatedData);
};

export default {
  uploadExcel: ctrlWrapper(uploadExcel),
  getData: ctrlWrapper(getData),
  updateData: ctrlWrapper(updateData),
  uploadMiddleware: upload.single("file"),
};

