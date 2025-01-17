import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import xlsx from "xlsx";
import { calculateNameSimilarity } from "./utils/similaity.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Hello from server",
  });
});

app.post("/api/compare-names", async (req, res) => {
  const { name1, name2 } = req.body;

  if (!name1 || !name2) {
    return res.status(400).json({ error: "Both 'name1' and 'name2' are required." });
  }

  const similarity = await calculateNameSimilarity(name1, name2);

  return res.status(200).json({
    isSuccess: true,
    message: "Name similarity calculated successfully.",
    similarity,
  });
});

app.get("/api/process-excel", async (req, res) => {
  try {
    const inputFilePath = path.join(__dirname, "name.xlsx");
    const outputFilePath = path.join(__dirname, "name-similarity.xlsx");

    const workbook = xlsx.readFile(inputFilePath);
    const sheetName = workbook.SheetNames[0]; 
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const batchSize = 100;

    let outputWorkbook;
    let outputSheet;

    if (fs.existsSync(outputFilePath)) {
      outputWorkbook = xlsx.readFile(outputFilePath);
      outputSheet = outputWorkbook.Sheets[sheetName];
    } else {
      outputWorkbook = xlsx.utils.book_new();
      outputSheet = xlsx.utils.json_to_sheet([]);
      xlsx.utils.book_append_sheet(outputWorkbook, outputSheet, sheetName);
    }

    const existingData = xlsx.utils.sheet_to_json(outputSheet);
    const processedRowsCount = existingData.length;

    for (let i = processedRowsCount; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const processedBatch = await Promise.all(
        batch.map(async (row, rowIndex) => {
          const kycName = row["KYC Name"];
          const rcName = row["RC Name"];

          if (kycName && rcName) {
            const similarity = await calculateNameSimilarity(kycName, rcName);
            return {
              ...row,
              ...similarity,
            };
          }
          return {
            ...row,
            FinalScore: "N/A",
          };
        })
      );

      existingData.push(...processedBatch);

      const updatedSheet = xlsx.utils.json_to_sheet(existingData);

      outputWorkbook.Sheets[sheetName] = updatedSheet;
      xlsx.writeFile(outputWorkbook, outputFilePath);
    }

    res.json({
      message:
        "Processing complete. You can download the file using the link below.",
      download: `/api/download/${path.basename(outputFilePath)}`,
    });
  } catch (error) {
    console.error("Error processing the Excel file:", error);
    res.status(500).json({ message: "Failed to process the file", error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
