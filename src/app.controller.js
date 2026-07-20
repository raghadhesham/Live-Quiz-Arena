import http from "http";
import { Server } from "socket.io";
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

const activeSessions = new Map();

export const bootstrap = async (app) => {
  await checkConnectionDB();
  await connectRedis();
  app.use("/api/quiz", questionRouter);
  app.use("/api/auth", authRouter);
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log("a user connected:", socket.id);
    console.log(socket.user);

    const requireSocketRoles =
      (...allowedRoles) =>
      (handler) =>
      async (payload) => {
        if (!socket.role || !allowedRoles.includes(socket.role)) {
          return socket.emit("quiz-error", {
            message: "Forbidden: insufficient permissions.",
          });
        }
        return handler(payload);
      };

    const joinSession = (quizCode) => {
      socket.join(quizCode);
      if (!activeSessions.has(quizCode)) {
        activeSessions.set(quizCode, { players: [] });
      }
      const session = activeSessions.get(quizCode);
      if (!session.players.some((p) => p.socketId === socket.id)) {
        session.players.push({
          socketId: socket.id,
          userId: socket.userId,
          role: socket.role,
        });
      }
    };

    socket.on(
      "join-quiz",
      requireSocketRoles(
        roleEnum.candidate,
        roleEnum.host,
      )(async (quizCode) => {
        joinSession(quizCode);
        console.log(`${socket.id} joined room: ${quizCode}`);
        socket.emit("joined-quiz", { quizCode });
        socket.to(quizCode).emit("player-joined", { playerID: socket.id });
      }),
    );

    socket.on(
      "startQuiz",
      requireSocketRoles(roleEnum.host)(async ({ quizCode }) => {
        io.to(quizCode).emit("quizStarted", {});
        console.log(`Quiz started for code: ${quizCode}`);
      }),
    );

    socket.on(
      "request-quiz",
      requireSocketRoles(roleEnum.candidate)(async ({ quizCode }) => {
        console.log(`Requesting quiz with code: ${quizCode}`);
        const payload = await getPlayerQuizQuestions(quizCode);
        if (!payload) {
          console.log(`Quiz not found for code: ${quizCode}`);
          return socket.emit("quiz-error", { message: "Quiz not found." });
        }

        socket.emit("quiz-requested", { quizCode, payload });
        console.log(`Successfully retrieved quiz for code: ${quizCode}`);
        socket.emit("quiz-data", payload);
      }),
    );

    socket.on(
      "submit-quiz",
      requireSocketRoles(roleEnum.candidate)(async ({ quizCode, answers }) => {
        try {
          const session = activeSessions.get(quizCode);
          if (!session) {
            socket.emit(
              "error-message",
              "This quiz session does not exist or has ended.",
            );
            return;
          }

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
