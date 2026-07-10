import dotenv from "dotenv";
import path from "path";

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

if (!process.env.DB_URI) {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env.development"),
  });
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
