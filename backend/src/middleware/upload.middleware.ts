import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';
import { AppError } from './error.middleware';

const uploadDirectory = path.resolve(process.cwd(), config.uploadDir);

// Ensure upload directory exists
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WebP) are allowed for receipt upload.', 400));
  }
};

export const uploadReceipt = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeBytes,
  },
  fileFilter,
});
