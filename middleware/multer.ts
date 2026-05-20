import multer from "multer";
import { Request } from "express";
import { AppError } from "./errorHandler";

const storage = multer.memoryStorage();
const allowedImageTypes = ["image/jpeg", "image/png"];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid image type. Please upload a PNG or JPEG image.",
        400,
      ) as Error,
    );
  }
};

export const upload = multer({
  storage: storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
