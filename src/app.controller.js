import http from "http";
import { Server } from "socket.io";
import questionRouter from "./modules/Questions/question.controllers.js";
import authRouter from "./modules/Auth/auth.controllers.js";
import {
  getPlayerQuizQuestions,
  calculateQuizScore,
} from "./modules/Questions/question.services.js";
import { checkConnectionDB } from "./DB/connectionDB.js";

export const bootstrap = async (app) => {
  await checkConnectionDB();
  app.use("/api/quiz", questionRouter);
  app.use("/api/auth", authRouter);
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
     cors: {
    origin: "*",
    methods: ["GET", "POST"], 
  },
  });
  io.on("connection", (socket) => {
    console.log("a user connected:", socket.id);
    socket.on("join-quiz", (quizCode) => {
      socket.join(quizCode);
      console.log(`${socket.id} joined room: ${quizCode}`);
      socket.emit("joined-quiz", { quizCode });
      socket.to(quizCode).emit("player-joined", { playerID: socket.id });
    });
    socket.on("startQuiz", ({ quizCode }) => {
      io.to(quizCode).emit("quizStarted", {});
      console.log(`Quiz started for code: ${quizCode}`);
    });

    socket.on("request-quiz", async ({ quizCode }) => {
      console.log(`Requesting quiz with code: ${quizCode}`);
      const payload = await getPlayerQuizQuestions(quizCode);
      socket.emit("quiz-requested", { quizCode, payload });
      console.log("Quiz payload:", payload);
      if (!payload) {
        console.log(`Quiz not found for code: ${quizCode}`);
        return socket.emit("quiz-error", { message: "Quiz not found." });
      }

      console.log(`Successfully retrieved quiz for code: ${quizCode}`);
      socket.emit("quiz-data", payload);
    });

    socket.on("submit-quiz", async ({ quizCode, answers }) => {
      try {
        const session = activeSessions.get(quizCode);
        if (!session) {
          socket.emit(
            "error-message",
            "This quiz session does not exist or has ended.",
          );
          return;
        }

        // Check 2: did THIS socket actually join this room/session?
        const player = session.players.find((p) => p.socketId === socket.id);
        if (!player) {
          socket.emit(
            "error-message",
            "You have not joined this quiz. Please join first.",
          );
          return;
        }
        const result = await calculateQuizScore(quizCode, answers);
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
      } catch (err) {
        console.error("Unexpected error in submit-answer:", err);
        socket.emit("error-message", "Something unexpected went wrong.");
      }
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
