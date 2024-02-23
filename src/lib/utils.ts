import fs from 'node:fs';
import sharp from 'sharp';
import path from 'node:path';
import { promisify } from 'node:util';
import { v2 as cloudinary } from 'cloudinary';
import { PaginatedResponse } from '../typings';
import { CLOUDINARY_FOLDER_NAME, RESULT_PER_PAGE } from '../Constants';

const sleep = promisify(setTimeout);

const range = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min) + min);
};

const tp = 1000 * 15;
// Max is 450K ms (7.5 minute)
const expBackOff = (k: number): number => {
  const r = range(0, 2 ** k + 1);
  return Math.max(tp * 2, r * tp);
};

function paginatedParameters(
  query: number | string,
  totalRecords: number,
  resultPerPage = RESULT_PER_PAGE
): PaginatedResponse {
  let queryNum = typeof query === 'number' ? query : parseInt(query, 10);
  if (Number.isNaN(queryNum) || !Number.isSafeInteger(queryNum)) {
    queryNum = 0;
  }
  const totalPages = Math.ceil(totalRecords / resultPerPage);
  const currentPage = Math.max(Math.min(queryNum, totalPages), 1);
  const skip = (currentPage - 1) * resultPerPage;
  const take = resultPerPage;
  return {
    skip,
    take,
    totalPages,
    currentPage
  };
}

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const formats = ['jpg', 'png', 'gif', 'webp'];
async function cloudinaryUpload(filePath: string, width = 400, height = 400): Promise<string> {
  const ext = path.extname(filePath);
  if (!formats.some(format => ext.endsWith(format))) {
    throw new Error('INVALID FORMAT', { cause: 'format not allowed' });
  }
  const file = filePath.replace(ext, '-2' + ext);
  try {
    await sharp(filePath).resize({ fit: 'cover', width, height }).toFile(file); // Better resizing than cloudinary
    const uploadedFile = await cloudinary.uploader.upload(file, {
      resource_type: 'image',
      folder: CLOUDINARY_FOLDER_NAME,
      allowed_formats: formats,
      transformation: [{ quality: 'auto:eco', fetch_format: 'auto' }]
    });
    return uploadedFile.secure_url;
  } finally {
    fs.unlinkSync(file);
    fs.unlinkSync(filePath);
  }
}

export { sleep, range, cloudinaryUpload, paginatedParameters, expBackOff };
