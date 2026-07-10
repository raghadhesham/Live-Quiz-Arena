import http from "http";
import { Server } from "socket.io";
import questionRouter from "./modules/Questions/question.controllers.js";
import {
  getPlayerQuizQuestions,
  calculateQuizScore,
} from "./modules/Questions/question.services.js";

export const bootstrap = (app) => {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);

  app.use("/api/quiz", questionRouter);

  app.get("/", (req, res) => {
    res.send("Quiz is up and running!");
  });

  io.on("connection", (socket) => {
    console.log("a user connected:", socket.id);

    socket.on("join-quiz", (quizCode) => {
      socket.join(quizCode);
      console.log(`${socket.id} joined room: ${quizCode}`);
      socket.emit("joined-quiz", { quizCode });
      socket.to(quizCode).emit("player-joined", { playerID: socket.id });
    });

    socket.on("request-quiz", ({ quizCode }) => {
      const payload = getPlayerQuizQuestions(quizCode);
      if (!payload) {
        return socket.emit("quiz-error", { message: "Quiz not found." });
      }
      socket.emit("quiz-data", payload);
    });

    socket.on("submit-quiz", ({ quizCode, answers }) => {
      const result = calculateQuizScore(quizCode, answers);
      if (!result) {
        return socket.emit("quiz-error", {
          message: "Quiz not found or invalid answer payload.",
        });
      }

      socket.emit("quiz-score", result);
      socket.to(quizCode).emit("player-submitted", {
        playerID: socket.id,
        score: result.score,
        total: result.total,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
