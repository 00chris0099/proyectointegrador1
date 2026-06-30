import multer from 'multer';
import axios from 'axios';
import { config } from '../../../config/environment';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan PDF, JPG.`));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});

export async function uploadToImgBB(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; deleteUrl: string }> {
  const base64Data = buffer.toString('base64');

  const formData = new URLSearchParams();
  formData.append('key', config.IMGBB_API_KEY);
  formData.append('image', base64Data);
  formData.append('name', filename.replace(/\.[^/.]+$/, ''));

  const response = await axios.post<{ data: { url: string; delete_url: string } }>('https://api.imgbb.com/1/upload', formData.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 30000,
  });

  if (!response.data || !response.data.data) {
    throw new Error('Error al subir archivo a imgBB');
  }

  return {
    url: response.data.data.url,
    deleteUrl: response.data.data.delete_url,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
