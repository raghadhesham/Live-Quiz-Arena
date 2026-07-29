import { Server } from "socket.io";
import http from "http";
import express from "express";

export const app = express();
export const httpServer = http.createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000/", "http://localhost:4200/"],
    methods: ["GET", "POST"],
  },
});
