
import { logger } from "../../../../services/logger.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";
const uploadPdfToS3Endpoint = async (req, res) => {
  console.info("uploadPdfToS3Endpoint");

  if (!req.file || !req.file.buffer) {
    console.error("--- No file uploaded or missing buffer ---");
    return res.status(400).json({ error: "No file uploaded" });
  }
    try {
    const pdfBuffer = req.file.buffer;
      const result = await uploadPdfToS3(pdfBuffer, req.file.originalname);

      logger.info(`--- File uploaded successfully: ${result} ---`);

      res.status(200).json({ message: "File uploaded", result });
    } catch (err) {
      logger.error("--- S3 upload failed ---", err);
      res.status(500).json({ error: "S3 upload failed" });
  }
};
export { uploadPdfToS3Endpoint };
