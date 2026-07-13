import test from "node:test";
import assert from "node:assert/strict";

import { addQuestionToQuiz } from "../src/modules/Questions/question.services.js";
import { Question } from "../src/DB/models/question.model.js";

test("addQuestionToQuiz retries when the next question number already exists", async () => {
  const originalFind = Question.find;
  const originalSave = Question.prototype.save;
  let saveCalls = 0;

  Question.find = () => ({
    sort: () => ({
      select: () => ({
        lean: async () => [{ questionNumber: 3 }],
      }),
    }),
  });
  Question.prototype.save = async function saveWithRetry() {
    saveCalls += 1;
    if (saveCalls === 1) {
      const error = new Error("duplicate key");
      error.code = 11000;
      throw error;
    }

    this.questionNumber = 4;
    return this;
  };

  try {
    const result = await addQuestionToQuiz("ABC123", {
      content: "New question",
      options: [
        { text: "A", isCorrect: false },
        { text: "B", isCorrect: true },
      ],
    });

    assert.equal(result.questionNumber, 4);
    assert.equal(saveCalls, 2);
  } finally {
    Question.find = originalFind;
    Question.prototype.save = originalSave;
  }
});
