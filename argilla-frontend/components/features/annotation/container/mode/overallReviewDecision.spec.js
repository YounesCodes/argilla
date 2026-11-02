import {
  CRITERIA,
  DECISIONS,
  overallDecision,
  setOverallDecision,
} from "./overallReviewDecision";

const questions = (decisions) =>
  CRITERIA.map((name, index) => {
    const values = DECISIONS.map((value) => ({
      value,
      isSelected: value === decisions[index],
    }));
    return {
      name,
      answer: {
        values,
        get valuesAnswered() {
          return values.find((option) => option.isSelected)?.value;
        },
      },
    };
  });

describe("Overall translation decision", () => {
  it("does not rewrite mixed historical decisions on read", () => {
    const saved = questions(["accept", "reject", "needs_edit"]);
    expect(overallDecision(saved)).toBe("reject");
    expect(saved.map((q) => q.answer.valuesAnswered)).toEqual([
      "accept",
      "reject",
      "needs_edit",
    ]);
  });
  it.each(DECISIONS)(
    "sets all existing criteria to %s when explicitly chosen",
    (value) => {
      const saved = questions(["accept", "reject", null]);
      setOverallDecision(saved, value);
      expect(saved.map((q) => q.answer.valuesAnswered)).toEqual([
        value,
        value,
        value,
      ]);
      expect(overallDecision(saved)).toBe(value);
    }
  );
  it("retains unanimous existing decisions", () => {
    expect(overallDecision(questions(["reject", "reject", "reject"]))).toBe(
      "reject"
    );
  });
  it.each([
    [["accept", "needs_edit", "accept"], "needs_edit"],
    [["needs_edit", "accept", "reject"], "reject"],
    [["accept", "accept", "reject"], "reject"],
    [["accept", "accept", "accept"], "accept"],
    [["accept", null, "accept"], null],
  ])("aggregates %j as %s", (values, expected) => {
    expect(overallDecision(questions(values))).toBe(expected);
  });
});
