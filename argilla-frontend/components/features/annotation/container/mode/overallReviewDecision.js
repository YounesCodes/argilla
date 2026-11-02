export const REVIEW_DATASET = "e002-doda-assisted-review-v1";
export const CRITERIA = [
  "transliteration",
  "english_translation",
  "french_translation",
];
export const DECISIONS = ["accept", "reject", "needs_edit"];

export function overallDecision(questions) {
  if (questions.length !== CRITERIA.length) return null;
  const values = questions.map((question) => question.answer.valuesAnswered);
  if (values.includes("reject")) return "reject";
  if (values.includes("needs_edit")) return "needs_edit";
  return values.every((value) => value === "accept") ? "accept" : null;
}

export function setOverallDecision(questions, decision) {
  if (!DECISIONS.includes(decision)) return;
  questions.forEach((question) => {
    question.answer.values.forEach((option) => {
      option.isSelected = option.value === decision;
    });
  });
}
