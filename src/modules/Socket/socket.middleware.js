import { Question } from "../../DB/models/question.model.js";

const requireSocketRoles =
  (...allowedRoles) =>
  (socket) =>
  (handler) =>
  async (payload) => {
    if (!socket.role || !allowedRoles.includes(socket.role)) {
      return socket.emit("quiz-error", {
        message: "Forbidden: insufficient permissions.",
      });
    }
    return handler(payload);
  };

const isQuizHost = async (quizCode, userId) => {
  const question = await Question.findOne({ quizCode }).lean();
  if (!question) return false;
  return String(question.userId) === String(userId);
};

const requireJoinedSession = (socket) => (handler) => async (payload) => {
  const { quizCode } = payload;
  const session = activeSessions.get(quizCode);
  const player = session?.players.find((p) => p.socketId === socket.id);

  if (!player) {
    return socket.emit("quiz-error", {
      message: "You have not joined this quiz. Please join first.",
    });
  }
  return handler(payload, player);
};
