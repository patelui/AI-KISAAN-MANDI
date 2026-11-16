import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const profileUploadsDir = path.resolve(__dirname, '../../uploads/profiles');
const cropUploadsDir = path.resolve(__dirname, '../../uploads/crops');

[profileUploadsDir, cropUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']);
const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const createStorage = (destinationDir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = allowedImageExtensions.has(ext) ? ext : '.jpg';
      const userId = req.user?.id || req.user?._id || 'user';
      cb(null, `${userId}-${Date.now()}${safeExt}`);
    },
  });

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = String(file.mimetype || '').toLowerCase();

  if (mimeType.startsWith('image/') || allowedImageMimeTypes.has(mimeType) || allowedImageExtensions.has(ext)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only image files are allowed (JPG, PNG, WEBP, GIF)'), false);
};

const createUploadMiddleware = (destinationDir) => {
  const upload = multer({
    storage: createStorage(destinationDir),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  return (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Image must be smaller than 5 MB.' });
        }

        return res.status(400).json({ message: error.message });
      }

      return res.status(400).json({ message: error.message || 'Image upload failed.' });
    });
  };
};

export const profilePhotoUpload = createUploadMiddleware(profileUploadsDir);
export const cropImageUpload = createUploadMiddleware(cropUploadsDir);
