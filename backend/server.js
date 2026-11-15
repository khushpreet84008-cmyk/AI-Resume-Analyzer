const express = require("express");
const multer = require("multer");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { analyzeResume } = require("./analyzer");

const app = express();
const PORT = process.env.PORT || 3000;

// Keep uploaded files in memory only (nothing is saved to disk -> better privacy)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

app.use(express.static(path.join(__dirname, "..", "frontend")));

async function extractText(file) {
  const name = file.originalname.toLowerCase();
  if (name.endsWith(".pdf") || file.mimetype === "application/pdf") {
    const data = await pdfParse(file.buffer);
    return data.text;
  }
  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }
  if (name.endsWith(".txt")) {
    return file.buffer.toString("utf8");
  }
  throw new Error("Unsupported file type. Please upload a PDF, DOCX or TXT file.");
}

app.post("/api/analyze", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please choose a resume file to upload." });
    }
    const text = await extractText(req.file);
    if (!text || text.trim().length < 80) {
      return res.status(422).json({
        error:
          "We could not read enough text from this file. If it is a scanned image, please upload a text-based PDF or DOCX.",
      });
    }
    const result = analyzeResume(text, {
      location: (req.body.location || "India").trim(),
      experienceLevel: req.body.level || "auto",
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Something went wrong while analysing the resume." });
  }
});

// Friendly error for oversized files
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large. Maximum size is 5 MB." });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`AI Resume Analyzer running at http://localhost:${PORT}`);
});
