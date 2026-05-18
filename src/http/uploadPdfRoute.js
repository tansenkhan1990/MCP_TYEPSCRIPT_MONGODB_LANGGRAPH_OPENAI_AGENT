import { toErrorMessage } from "../lib/errors.js";
import { normalizeBody, pickField } from "../lib/requestFields.js";
import { uploadPdfDocument } from "../rag/uploadPdf.js";
import { pdfUpload } from "./multerPdf.js";

const DESCRIPTION_KEYS = ["description", "desc"];
const FILE_FIELDS = new Set(["file", "pdf", "document"]);

function getUploadedFile(req) {
  const files = [
    ...(req.file ? [req.file] : []),
    ...(Array.isArray(req.files) ? req.files : []),
    ...Object.values(req.files ?? {}).flatMap((entry) => (Array.isArray(entry) ? entry : [])),
  ];

  return (
    files.find((entry) => entry?.buffer && FILE_FIELDS.has(entry.fieldname)) ??
    files.find((entry) => entry?.buffer) ??
    null
  );
}

export function registerUploadPdfRoute(app) {
  app.post("/api/upload-pdf", pdfUpload.any(), async (req, res) => {
    try {
      const file = getUploadedFile(req);
      if (!file) {
        return res.status(400).json({
          error: `Multipart PDF required (field: ${[...FILE_FIELDS].join(", ")}).`,
          example: { formData: { file: "<pdf>", description: "optional label" } },
        });
      }

      const body = normalizeBody(req.body);
      
      const result = await uploadPdfDocument({
        buffer: file.buffer,
        fileName: file.originalname || "upload.pdf",
        description: pickField([body, req.query], DESCRIPTION_KEYS),
      });

      return res.status(201).json(result);
    } catch (err) {
      const message = toErrorMessage(err);
      return res.status(message.includes("Only PDF") ? 400 : 500).json({ error: message });
    }
  });
}
