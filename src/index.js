import express from "express";
import { bootstrap } from "./app.controller.js";
import cors from "cors";
import { app as sharedApp } from "./modules/Socket/socket.server.js";

export const app = sharedApp;
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.send("Quiz is up and running!");
});
await bootstrap(app);
export default app;
