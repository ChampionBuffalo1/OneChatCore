import fs from 'node:fs';
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

function paginatedParameters(query: string, totalRecords: number, resultPerPage = RESULT_PER_PAGE): PaginatedResponse {
  let queryNum = query ? parseInt(query, 10) : 0;
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
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


async function cloudinaryUpload(filePath: string): Promise<string> {
  try {
    const uploadedFile = await cloudinary.uploader.upload(filePath, {
      resource_type: 'image',
      folder: CLOUDINARY_FOLDER_NAME,
      allowed_formats: ['jpg', 'png', 'gif', 'webp']
    });
    return uploadedFile.secure_url;
  } catch (err) {
    throw err;
  } finally {
    fs.unlinkSync(filePath);
  }
}

export { sleep, range, cloudinaryUpload, paginatedParameters, expBackOff };
