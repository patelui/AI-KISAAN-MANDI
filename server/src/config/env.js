import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export function getEnv() {
  const JWT_SECRET = process.env.JWT_SECRET?.trim();
  const MONGO_URI = process.env.MONGO_URI?.trim();
  const PORT = process.env.PORT?.trim() || '5000';

  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is missing. Copy server/.env.example to server/.env and set a strong secret.'
    );
  }

  if (!MONGO_URI) {
    throw new Error(
      'MONGO_URI is missing. Copy server/.env.example to server/.env and set your MongoDB URI.'
    );
  }

  return {
    JWT_SECRET,
    MONGO_URI,
    PORT: Number(PORT),
  };
}
