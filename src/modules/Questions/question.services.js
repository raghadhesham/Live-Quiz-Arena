import { questionSchema, questionListSchema } from "./question.validation.js";
import { Question } from "../../DB/models/question.model.js";

export const addQuestionToQuiz = async (quizCode, payload) => {
  const validated = questionSchema.parse(payload);
  // compute next sequential questionNumber for this quizCode
  const last = await Question.findOne({ quizCode })
    .sort({ questionNumber: -1 })
    .select("questionNumber")
    .lean();
  const nextQuestionNumber = last?.questionNumber ? last.questionNumber + 1 : 1;

  const question = new Question({
    questionNumber: nextQuestionNumber,
    quizCode,
    content: validated.content.trim(),
    options: validated.options.map((option, index) => ({
      id: `${index}-${Math.random().toString(36).slice(2)}`,
      text: option.text.trim(),
      isCorrect: option.isCorrect,
    })),
  });

  await question.save();
  return question.toObject();
};

export const getPlayerQuizQuestions = async (quizCode) => {
  const questions = await Question.find({ quizCode }).lean();
  if (!questions.length) return null;
  return {
    quizCode,
    questions: questions.map((question) => ({
      id: question.questionNumber,
      content: question.content,
      options: question.options.map(({ id, text }) => ({ id, text })),
    })),
  };
};

export const calculateQuizScore = async (quizCode, answers) => {
  const questions = await Question.find({ quizCode }).lean();
  if (!questions.length || !Array.isArray(answers)) return null;

  const validatedAnswers = questionListSchema.parse(answers);
  const scoreDetails = questions.map((question) => {
    const answer = validatedAnswers.find((item) => {
      // support numeric questionNumber or string IDs
      if (typeof item.questionId === "number")
        return item.questionId === question.questionNumber;
      return String(item.questionId) === String(question.questionNumber);
    });
    const selectedOption = question.options[answer?.selectedOptionIndex];
    return {
      questionId: question.questionNumber,
      correct: Boolean(selectedOption?.isCorrect),
      selectedOptionId: selectedOption?.id || null,
      correctOptionIds: question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id),
    };
  });

  const score = scoreDetails.reduce(
    (sum, detail) => sum + (detail.correct ? 1 : 0),
    0,
  );
  return {
    quizCode,
    score,
    total: questions.length,
    details: scoreDetails,
  };
};
