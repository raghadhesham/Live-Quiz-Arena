import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const projectRoot = path.resolve(currentDir, "../../..");
const searchRoots = [projectRoot, process.cwd()];
const envFiles = process.env.NODE_ENV
  ? [`.env.${process.env.NODE_ENV}`, ".env", ".env.development", ".env.local"]
  : [".env", ".env.development", ".env.local"];

for (const root of searchRoots) {
  for (const envFile of envFiles) {
    const resolvedPath = path.resolve(root, envFile);

    if (fs.existsSync(resolvedPath)) {
      dotenv.config({ path: resolvedPath, override: true });
    }
  }
}

export const config = {
  env: process.env.NODE_ENV,
  db: {
    name: process.env.DB_NAME,
    uri: process.env.DB_URI,
  },
  port: {
    port: process.env.DB_PORT,
  },
  jwt: {
    access_key: process.env.ACCESS_TOKEN_KEY,
    refresh_key: process.env.REFRESH_TOKEN_KEY,
    access_expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    refresh_expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
    audience: process.env.AUDIENCE,
    prefix: process.env.PREFIX,
  },
};
