import { Question } from "../../DB/models/question.model.js";
import { activeSessions } from "./socket.sessions.js";

export const requireJoinedSession =
  (socket) => (handler) => async (payload) => {
    const session = activeSessions.get(payload.quizCode);

    const player = session?.players.find((p) => p.socketId === socket.id);

    if (!player) {
      return socket.emit("quiz-error", {
        message: "Join the quiz first.",
      });
    }

    return handler(payload, player);
  };
export const joinSession = (socket, quizCode) => {
  socket.join(quizCode);

  if (!activeSessions.has(quizCode)) {
    activeSessions.set(quizCode, {
      players: [],
    });
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

export const isQuizHost = async (quizCode, userId) => {
  const question = await Question.findOne({ quizCode }).lean();

  if (!question) return false;

  return String(question.userId) === String(userId);
};
