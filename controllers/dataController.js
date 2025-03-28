import multer from "multer";
import xlsx from "xlsx";
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
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Получаем массив массивов
  
    if (jsonData.length <= 1) {
      return res.status(400).json({ message: "No data found in the Excel file" });
    }
  
    // Определение значений для столбцов
    const orgStructureRSM = "orgStructureRSM";
    const orgStructureTSM = "orgStructureTSM";
    const orgStructureSUP = "orgStructureSUP";
    const orgStructureTP = "orgStructureTP";
    const visitDate = "visitDate";
    const monthYear = "monthYear";
    const ttActualName = "ttActualName";
    const ttCity = "ttCity";
    const ttActualAddress = "ttActualAddress";
    const ttSubtype = "ttSubtype";
    const ttComment = "ttComment";
    const ttAdditionalId = "ttAdditionalId";
    const ttNetwork = "ttNetwork";
    const mrmMkk = "mrmMkk";
    const ttNumber = "ttNumber";
    const survey = "survey";
    const surveyPage = "surveyPage";
    const surveyElement = "surveyElement";
    const surveyAnswer = "surveyAnswer";
    const surveyContentLink = "surveyContentLink";
  
    const columnMap = {
      "Оргструктура: RSM": orgStructureRSM,
      "Оргструктура: TSM": orgStructureTSM,
      "Оргструктура: SUP": orgStructureSUP,
      "Оргструктура: ТП": orgStructureTP,
      "Візит: Дата": visitDate,
      "Міс'Рік": monthYear,
      "ТТ: Фактична назва": ttActualName,
      "Географія ТТ: Місто": ttCity,
      "ТТ: Фактична адреса": ttActualAddress,
      "ТТ: Підтип": ttSubtype,
      "ТТ: Коментар (Сегмент)": ttComment,
      "ТТ: Додатковий ідентифікатор": ttAdditionalId,
      "ТТ: Мережа": ttNetwork,
      "МРМ/МКК": mrmMkk,
      "ТТ: №": ttNumber,
      Анкета: survey,
      "Анкета: Сторінка": surveyPage,
      "Анкета: Елемент": surveyElement,
      "Анкета: Відповідь": surveyAnswer,
      "Анкета: Посилання на контент МБД": surveyContentLink,
    };
  
    const groupedData = {};

  jsonData.slice(1).forEach((row) => {
    let obj = {};
    jsonData[0].forEach((key, index) => {
      if (columnMap[key]) {
        let value = row[index] || "";

        // Обрабатываем дату
        if (key === "Візит: Дата" && typeof value === "string") {
          // Попытка преобразовать значение в метку времени
          const timestamp = new Date(value).getTime();
          if (!isNaN(timestamp)) {
            // Если метка времени валидна, то создаем новый объект Date
            const date = new Date(timestamp);
            // Форматируем дату как dd.mm.yyyy
            value = `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
          } else {
            value = ""; // Если не удалось преобразовать, оставляем пустое значение
          }
        }

        obj[columnMap[key]] = value;
      }
    });

    const { visitDate, ttNumber } = obj;
    if (!visitDate || !ttNumber) return;

    if (!groupedData[visitDate]) {
      groupedData[visitDate] = {};
    }

    if (!groupedData[visitDate][ttNumber]) {
      groupedData[visitDate][ttNumber] = [];
    }

    groupedData[visitDate][ttNumber].push(obj);
  });

  // Удаление всех данных перед вставкой новых
  await DataModel.deleteMany();

  // Вставляем данные в базу данных
  const insertedData = await DataModel.insertMany(
    Object.entries(groupedData).map(([visitDate, ttNumbers]) => ({
      visitDate,
      ttNumbers,
    }))
  );
  
    // Удаляем загруженный файл (если он есть)
    fs.unlink(filePath, (err) => {
      if (err) console.error("Ошибка удаления файла:", err);
    });
  
    res.json({ message: "Data uploaded successfully", data: insertedData });
  };
  

const getData = async (req, res) => {
  const filters = req.query;
  const data = await DataModel.find(filters);
  res.json(data);
};

const updateData = async (req, res) => {
  const { id, updatedFields } = req.body;
  const updatedData = await DataModel.findByIdAndUpdate(id, updatedFields, {
    new: true,
  });
  res.json(updatedData);
};

export default {
  uploadExcel: ctrlWrapper(uploadExcel),
  getData: ctrlWrapper(getData),
  updateData: ctrlWrapper(updateData),
  uploadMiddleware: upload.single("file"),
};
