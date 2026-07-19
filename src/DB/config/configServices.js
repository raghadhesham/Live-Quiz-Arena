import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const projectRoot = path.resolve(currentDir, "../../..");
const searchRoots = [projectRoot, process.cwd()];
const envFiles = [".env", ".env.local"];

if (process.env.NODE_ENV) {
  envFiles.push(`.env.${process.env.NODE_ENV}`);
}

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  envFiles.push(".env.development");
}

for (const root of searchRoots) {
  for (const envFile of envFiles) {
    const resolvedPath = path.resolve(root, envFile);

    if (fs.existsSync(resolvedPath)) {
      const parsedEnv = dotenv.config({ path: resolvedPath, quiet: true });

      if (parsedEnv.parsed) {
        for (const [key, value] of Object.entries(parsedEnv.parsed)) {
          if (!process.env[key] || process.env[key] === "") {
            process.env[key] = value;
          }
        }
      }
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
  redis: {
    redis_url:process.env.REDIS_URL
  }
};
