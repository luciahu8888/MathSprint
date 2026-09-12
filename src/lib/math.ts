import type { FactStats, PracticeQuestion, QuestionType } from "@/lib/types";

const PRIORITY_FACTS: Array<[number, number]> = [
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 7],
  [6, 8],
  [7, 9],
];

const ORDERED_MULTIPLICATION_FACTS: Array<[number, number]> = (() => {
  const facts: Array<[number, number]> = [];
  for (let left = 1; left <= 9; left += 1) {
    for (let right = left; right <= 9; right += 1) {
      facts.push([left, right]);
    }
  }
  return facts;
})();

const OPERATIONS: Record<Exclude<QuestionType, "mixed">, (a: number, b: number) => number> = {
  multiplication: (a, b) => a * b,
  addition: (a, b) => a + b,
  subtraction: (a, b) => a - b,
  division: (a, b) => a / b,
};

const SYMBOLS: Record<Exclude<QuestionType, "mixed">, string> = {
  multiplication: "x",
  addition: "+",
  subtraction: "-",
  division: "÷",
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function factKey(a: number, b: number, type: QuestionType): string {
  return `${type}:${a}x${b}`;
}

function getMasteryWeight(stat?: FactStats): number {
  if (!stat) {
    return 4;
  }

  const accuracy = stat.totalAttempts > 0 ? stat.correctAttempts / stat.totalAttempts : 0;
  const speedPenalty = Math.min(stat.averageResponseTimeMs / 4000, 2);
  const base = 1 - accuracy + speedPenalty;

  switch (stat.masteryLevel) {
    case "new":
      return base + 1.5;
    case "learning":
      return base + 1;
    case "steady":
      return base + 0.4;
    case "mastered":
      return Math.max(0.2, base * 0.25);
    default:
      return base;
  }
}

function buildChoices(correctAnswer: number): number[] {
  const values = new Set<number>([correctAnswer]);

  while (values.size < 4) {
    const variation = randomInt(-9, 9);
    const candidate = Math.max(0, correctAnswer + variation);
    if (candidate !== correctAnswer) {
      values.add(candidate);
    }
  }

  return Array.from(values).sort(() => Math.random() - 0.5);
}

function randomMultiplicationOperands(): [number, number] {
  return [randomInt(1, 9), randomInt(1, 9)];
}

function pickWeightedFact(type: QuestionType, factStats: Record<string, FactStats>): [number, number] {
  const candidates: Array<{
    operands: [number, number];
    weight: number;
  }> = [];

  for (let a = 1; a <= 9; a += 1) {
    for (let b = 1; b <= 9; b += 1) {
      const key = factKey(a, b, type);
      const stat = factStats[key];
      let weight = getMasteryWeight(stat);

      if (PRIORITY_FACTS.some(([pa, pb]) => pa === a && pb === b)) {
        weight += 1.2;
      }

      candidates.push({ operands: [a, b], weight });
    }
  }

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const candidate of candidates) {
    roll -= candidate.weight;
    if (roll <= 0) {
      return candidate.operands;
    }
  }

  return candidates[candidates.length - 1].operands;
}

function normalizeType(type: QuestionType): Exclude<QuestionType, "mixed"> {
  if (type !== "mixed") {
    return type;
  }

  const options: Array<Exclude<QuestionType, "mixed">> = [
    "multiplication",
    "addition",
    "subtraction",
    "division",
  ];
  return options[randomInt(0, options.length - 1)];
}

export function getFactKey(type: QuestionType, operands: [number, number]): string {
  return factKey(operands[0], operands[1], type);
}

export function generateQuestion(
  requestedType: QuestionType,
  factStats: Record<string, FactStats>,
): PracticeQuestion {
  const questionType = normalizeType(requestedType);

  let operands: [number, number];
  if (questionType === "multiplication") {
    operands = pickWeightedFact(questionType, factStats);
  } else {
    operands = randomMultiplicationOperands();
  }

  if (questionType === "division") {
    const [a, b] = randomMultiplicationOperands();
    operands = [a * b, b];
  }

  if (questionType === "subtraction") {
    const [a, b] = randomMultiplicationOperands();
    operands = [Math.max(a, b), Math.min(a, b)];
  }

  const [left, right] = operands;
  const op = OPERATIONS[questionType];
  const symbol = SYMBOLS[questionType];
  const correctAnswer = Math.round(op(left, right));

  return {
    questionType,
    operands,
    prompt: `${left} ${symbol} ${right} = ?`,
    correctAnswer,
    choices: buildChoices(correctAnswer),
  };
}

export function generateOrderedMultiplicationQuestion(index: number): PracticeQuestion {
  const normalizedIndex =
    ((index % ORDERED_MULTIPLICATION_FACTS.length) + ORDERED_MULTIPLICATION_FACTS.length) %
    ORDERED_MULTIPLICATION_FACTS.length;
  const [left, right] = ORDERED_MULTIPLICATION_FACTS[normalizedIndex];
  const correctAnswer = left * right;

  return {
    questionType: "multiplication",
    operands: [left, right],
    prompt: `${left} x ${right} = ?`,
    correctAnswer,
    choices: buildChoices(correctAnswer),
  };
}
