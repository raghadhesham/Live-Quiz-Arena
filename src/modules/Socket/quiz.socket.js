import {
  getPlayerQuizQuestions,
  calculateQuizScore,
} from "../modules/Questions/question.services.js";

import {
  joinSession,
  requireJoinedSession,
  isQuizHost,
} from "./socket.utils.js";

export const registerQuizEvents = (io, socket) => {

  socket.on("join-quiz", ({ quizCode }) => {
    joinSession(socket, quizCode);

    socket.emit("joined-quiz", { quizCode });

    socket.to(quizCode).emit("player-joined", {
      playerID: socket.id,
    });
  });

  socket.on("startQuiz", async ({ quizCode }) => {

    if (!(await isQuizHost(quizCode, socket.userId))) {
      return socket.emit("quiz-error", {
        message: "Only host can start.",
      });
    }

    io.to(quizCode).emit("quizStarted");
  });

  socket.on(
    "request-quiz",
    requireJoinedSession(socket)(async ({ quizCode }) => {

      const payload = await getPlayerQuizQuestions(quizCode);

      socket.emit("quiz-data", payload);

    })
  );

  socket.on(
    "submit-quiz",
    requireJoinedSession(socket)(
      async ({ quizCode, answers }) => {

        const result = await calculateQuizScore(
          quizCode,
          answers
        );

        socket.emit("quiz-score", result);

        socket.to(quizCode).emit("player-submitted", {
          playerID: socket.id,
          score: result.score,
          total: result.total,
        });

      }
    )
  );

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
  });

};