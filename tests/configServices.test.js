import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const configModulePath = path.resolve(
  projectRoot,
  "src/DB/config/configServices.js",
);

test("loads environment variables from the project root even when cwd changes", async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "live-quiz-arena-"));
  const previousCwd = process.cwd();
  const previousNodeEnv = process.env.NODE_ENV;
  const envFilePath = path.join(projectRoot, ".env.production");

  try {
    writeFileSync(
      envFilePath,
      "DB_URI=mongodb://localhost:27017/test-db\nDB_NAME=test-db\n",
      "utf8",
    );

    process.chdir(tempDir);
    process.env.NODE_ENV = "production";
    process.env.DB_URI = "";
    process.env.DB_NAME = "";

    const { config } = await import(
      `${pathToFileURL(configModulePath).href}?t=${Date.now()}`
    );

    assert.equal(config.db.uri, "mongodb://localhost:27017/test-db");
    assert.equal(config.db.name, "test-db");
  } finally {
    rmSync(envFilePath, { force: true });
    process.chdir(previousCwd);
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    delete process.env.DB_URI;
    delete process.env.DB_NAME;
    rmSync(tempDir, { recursive: true, force: true });
  }
});
