import questionRouter from "./modules/Questions/question.controllers.js";
import authRouter from "./modules/Auth/auth.controllers.js";
import {
  getPlayerQuizQuestions,
  calculateQuizScore,
} from "./modules/Questions/question.services.js";
import { checkConnectionDB } from "./DB/connectionDB.js";
import { authenticateSocket } from "./common/middleware/authentication.js";
import { roleEnum } from "./common/utils/enums/user.enum.js";
import { connectRedis } from "./DB/redis/redis.connection.js";
import { Question } from "./DB/models/question.model.js";
import { httpServer, io } from "./modules/Socket/socket.server.js";
import { activeSessions } from "./modules/Socket/socket.sessions.js";
import {
  isQuizHost,
  requireJoinedSession,
  joinSession,
} from "./modules/Socket/socket.utils.js";

export const bootstrap = async (app) => {
  await checkConnectionDB();
  await connectRedis();
  app.use("/api/quiz", questionRouter);
  app.use("/api/auth", authRouter);
  io.use(authenticateSocket);
  io.on("connection", (socket) => {
    console.log("a user connected:", socket.id);
    console.log(socket.user);

    socket.on("join-quiz", async ({ quizCode }) => {
      joinSession(socket, quizCode);
      console.log(`${socket.id} joined room: ${quizCode}`);
      socket.emit("joined-quiz", { quizCode });
      socket.to(quizCode).emit("player-joined", { playerID: socket.id });
    });
    socket.on("startQuiz", async ({ quizCode }) => {
      const isHost = await isQuizHost(quizCode, socket.userId);
      if (!isHost) {
        return socket.emit("quiz-error", {
          message: "Only the host can start this quiz.",
        });
      }
      io.to(quizCode).emit("quizStarted", {});
      console.log(`Quiz started for code: ${quizCode}`);
    });

    socket.on(
      "request-quiz",
      requireJoinedSession(socket)(async ({ quizCode }) => { 
        console.log(`Requesting quiz with code: ${quizCode}`);
        const payload = await getPlayerQuizQuestions(quizCode);
        if (!payload) {
          return socket.emit("quiz-error", { message: "Quiz not found." });
        }
        console.log("payload", payload);
        socket.emit("quiz-data", payload);
      }),
    );

    socket.on(
      "submit-quiz",
      requireJoinedSession(socket)(async ({ quizCode, answers }, player) => {
        try {
          console.log(
            "room members:",
            io.sockets.adapter.rooms.get(quizCode)?.size,
            [...(io.sockets.adapter.rooms.get(quizCode) ?? [])],
          );
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
          socket.emit("quiz-error", {
            message: "Something unexpected went wrong.",
          });
        }
      }),
    );

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const [quizCode, session] of activeSessions.entries()) {
        session.players = session.players.filter(
          (p) => p.socketId !== socket.id,
        );
        if (session.players.length === 0) {
          activeSessions.delete(quizCode);
        }
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
