import multer from "multer";
import { env } from "../config/env.js";

const storage = multer.memoryStorage();

export const pdfUpload = multer({
  storage,
  limits: { fileSize: env.pdfMaxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname?.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      cb(new Error("Only PDF files are allowed."));
      return;
    }
    cb(null, true);
  },
});
