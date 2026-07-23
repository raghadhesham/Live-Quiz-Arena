import { z } from "zod";

export const optionSchema = z.object({
  text: z.string().min(1, "Option text is required."),
  isCorrect: z.boolean(), 
});

export const questionSchema = z.object({
  content: z.string().min(1, "Question content is required."),
  options: z.array(optionSchema).min(2, "At least 2 options are required."),
});
 
export const questionListSchema = z.array(
  z.object({
    questionId: z.union([z.string().min(1), z.number().int().positive()]),
    selectedOptionIndex: z.number().int().nonnegative(),
  }),
); 
 