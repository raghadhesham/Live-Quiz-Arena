import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    quizCode: { type: String, required: true, index: true },
    content: { type: String, required: true },
    options: {
      type: [optionSchema],
      required: true,
      validate: [(val) => val.length >= 2, "At least 2 options are required."],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export const Question = mongoose.model("Question", questionSchema);
