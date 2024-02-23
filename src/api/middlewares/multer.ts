import fs from 'node:fs';
import multer from 'multer';
import path from 'node:path';
import { Logger } from '../../lib';
import type { Request } from 'express';

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  Logger.info('Upload folder created successfully');
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (
      file.mimetype !== 'image/gif' &&
      file.mimetype !== 'image/png' &&
      file.mimetype !== 'image/jpeg' &&
      file.mimetype !== 'image/webp'
    ) {
      cb(new Error('File must be a image'));
    }

    // 10MB
    if (file.size > 10 * 1e6) {
      cb(new Error('File must be less than 10MB'));
    }
    cb(null, true);
  }
});

export default upload;
