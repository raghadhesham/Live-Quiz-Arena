import express from "express";
import {
  addQuestionToQuiz,
  getPlayerQuizQuestions,
} from "./question.services.js";
import { questionSchema } from "./question.validation.js";

const router = express.Router();

router.post("/:quizCode/questions", async (req, res) => {
  try {
    questionSchema.parse(req.body);
    const { quizCode } = req.params;
    const question = await addQuestionToQuiz(quizCode, req.body);
    return res.status(201).json({ quizCode, question });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error.errors?.[0]?.message || error.message });
  }
});

router.get("/:quizCode/questions", async (req, res) => {
  const { quizCode } = req.params;
  const quizPayload = await getPlayerQuizQuestions(quizCode);

  if (!quizPayload) {
    return res.status(404).json({ error: "Quiz not found." });
  }

  return res.json(quizPayload);
});

export default router;
