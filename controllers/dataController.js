import path from "path";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import DataModel from "../models/data.js";
import ctrlWrapper from "../decorators/ctrlWrapper.js";
import dbConnect from "../utils/dbConnect.js";
import { Readable } from "stream";

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
  const verifiedResult = "verifiedResult";

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
    "Статус перевірки": verifiedResult,
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
            value = `${String(date.getDate()).padStart(2, "0")}.${String(
              date.getMonth() + 1
            ).padStart(2, "0")}.${date.getFullYear()}`;
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

    // Добавляем поле verified к каждому ttNumber
    const result = obj.verifiedResult.toLowerCase();
    if (result === "" || result === "(пусто)") {
      obj.verified = false;
    } else if (result === "ок" || result === "ok") {
      obj.verified = true;
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

const getExcelFile = async (req, res) => {
  try {
    const rawData = await DataModel.find({});

    const transformedData = rawData.flatMap((doc) =>
      Array.from(doc.ttNumbers.entries()).flatMap(([ttNumber, entries]) => {
        if (!Array.isArray(entries)) {
          console.error(
            `Ошибка: entries не массив для ttNumber ${ttNumber}`,
            entries
          );
          return []; // Пропустить некорректные записи
        }

        return entries.map((entry) => ({
          "Оргструктура: RSM": entry.orgStructureRSM,
          "Оргструктура: TSM": entry.orgStructureTSM,
          "Оргструктура: SUP": entry.orgStructureSUP,
          "Оргструктура: ТП": entry.orgStructureTP,
          "Візит: Дата": doc.visitDate,
          "Міс'Рік": entry.monthYear,
          "ТТ: Фактична назва": entry.ttActualName,
          "Географія ТТ: Місто": entry.ttCity,
          "ТТ: Фактична адреса": entry.ttActualAddress,
          "ТТ: Підтип": entry.ttSubtype,
          "ТТ: Коментар (Сегмент)": entry.ttComment,
          "ТТ: Додатковий ідентифікатор": entry.ttAdditionalId || "",
          "ТТ: Мережа": entry.ttNetwork || "",
          "МРМ/МКК": entry.mrmMkk || "",
          "ТТ: №": ttNumber,
          Анкета: entry.survey,
          "Анкета: Сторінка": entry.surveyPage,
          "Анкета: Елемент": entry.surveyElement,
          "Анкета: Відповідь": entry.surveyAnswer,
          "Анкета: Посилання на контент МБД": entry.surveyContentLink,
          "Статус перевірки": entry.verifiedResult || "",
        }));
      })
    );

    console.log("Трансформированные данные:", transformedData);

    // Создание Excel-файла в памяти
    const ws = xlsx.utils.json_to_sheet(transformedData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Data");

    // Записываем файл в буфер
    const fileBuffer = xlsx.write(wb, { bookType: "xlsx", type: "buffer" });

    // Устанавливаем заголовки для скачивания файла
    res.setHeader("Content-Disposition", "attachment; filename=data.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Создаем поток из буфера и отправляем его
    const readable = Readable.from(fileBuffer);
    readable.pipe(res);
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
    res.status(500).json({ message: "Ошибка при получении данных", error });
  }
};

const getData = async (req, res) => {
  const filters = req.query;
  const data = await DataModel.find(filters);
  res.json(data);
};

const updateData = async (req, res) => {
  if (req.method !== "PATCH") {
    // Проверяем метод PATCH
    return res.status(405).json({ message: "Метод не поддерживается" });
  }

  await dbConnect();

  try {
    // Обрабатываем каждый элемент из массива newData
    const updatePromises = req.body.data.map(async (item) => {
      const { visitDate, ttNumbers } = item;

      // Проходим по всем ключам и обновляем данные
      for (const [key, ttArray] of Object.entries(ttNumbers)) {
        // Обновляем каждый элемент в массиве ttArray
        for (const tt of ttArray) {
          const result = await DataModel.findOneAndUpdate(
            { visitDate, [`ttNumbers.${key}`]: { $exists: true } },
            {
              $set: {
                [`ttNumbers.${key}.$[].verified`]: true,
                [`ttNumbers.${key}.$[].verifiedResult`]: tt.verifiedResult,
              },
            },
            { new: true }
          );

          if (!result) {
            throw new Error(
              `Не найдено для visitDate: ${visitDate} и key: ${key}`
            );
          }
        }
      }
    });

    // Дожидаемся выполнения всех обновлений
    await Promise.all(updatePromises);

    res.status(200).json({ message: "Успешно обновлено" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера", error });
  }
};

export default {
  uploadExcel: ctrlWrapper(uploadExcel),
  getData: ctrlWrapper(getData),
  getExcelFile: ctrlWrapper(getExcelFile),
  updateData: ctrlWrapper(updateData),
  uploadMiddleware: upload.single("file"),
};
