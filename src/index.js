import express from "express";
import { bootstrap } from "./app.controller.js";
import { checkConnectionDB } from "./DB/connectionDB.js";

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.send("Quiz is up and running!");
});
await bootstrap(app);
export default app;
