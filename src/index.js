import express from "express";
import { bootstrap } from "./app.controller.js";
import { checkConnectionDB } from "./DB/connectionDB.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors())
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.send("Quiz is up and running!");
});
await bootstrap(app);
export default app;
