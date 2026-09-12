import { getFactKey } from "@/lib/math";
import type { AnswerAttempt, DailySummary, FactStats, MasteryLevel, QuestionType } from "@/lib/types";

const ATTEMPTS_KEY = "mathquest.attempts.v1";
const FACTS_KEY = "mathquest.factStats.v1";
const FACT_INDEX_KEY = "mathquest.factIndex.v1";

function isClient(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isClient()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isClient()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getMasteryLevel(accuracy: number, avgResponseMs: number, attempts: number): MasteryLevel {
  if (attempts < 3) {
    return "new";
  }
  if (accuracy >= 0.9 && avgResponseMs <= 2200 && attempts >= 8) {
    return "mastered";
  }
  if (accuracy >= 0.8 && avgResponseMs <= 3500) {
    return "steady";
  }
  return "learning";
}

function dateOnly(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function getOrderedFactIndex(): number {
  return readJson<number>(FACT_INDEX_KEY, 0);
}

export function saveOrderedFactIndex(index: number): void {
  writeJson(FACT_INDEX_KEY, index);
}

export function getAttempts(): AnswerAttempt[] {
  return readJson<AnswerAttempt[]>(ATTEMPTS_KEY, []);
}

export function saveAttempts(next: AnswerAttempt[]): void {
  writeJson(ATTEMPTS_KEY, next);
}

export function appendAttempts(newAttempts: AnswerAttempt[]): void {
  const current = getAttempts();
  saveAttempts([...current, ...newAttempts]);
}

export function getFactStatsMap(): Record<string, FactStats> {
  return readJson<Record<string, FactStats>>(FACTS_KEY, {});
}

export function saveFactStatsMap(stats: Record<string, FactStats>): void {
  writeJson(FACTS_KEY, stats);
}

export function updateFactsFromAttempts(newAttempts: AnswerAttempt[]): void {
  const map = getFactStatsMap();

  for (const attempt of newAttempts) {
    const key = getFactKey(attempt.questionType, attempt.operands);
    const existing = map[key];

    if (!existing) {
      map[key] = {
        key,
        questionType: attempt.questionType,
        operands: attempt.operands,
        totalAttempts: 1,
        correctAttempts: attempt.isCorrect ? 1 : 0,
        incorrectAttempts: attempt.isCorrect ? 0 : 1,
        averageResponseTimeMs: attempt.responseTimeMs,
        lastPracticedDate: dateOnly(attempt.timestamp),
        masteryLevel: "new",
      };
      continue;
    }

    const totalAttempts = existing.totalAttempts + 1;
    const totalResponse = existing.averageResponseTimeMs * existing.totalAttempts + attempt.responseTimeMs;
    const averageResponseTimeMs = totalResponse / totalAttempts;
    const correctAttempts = existing.correctAttempts + (attempt.isCorrect ? 1 : 0);
    const incorrectAttempts = existing.incorrectAttempts + (attempt.isCorrect ? 0 : 1);
    const accuracy = correctAttempts / totalAttempts;

    map[key] = {
      ...existing,
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      averageResponseTimeMs,
      lastPracticedDate: dateOnly(attempt.timestamp),
      masteryLevel: getMasteryLevel(accuracy, averageResponseTimeMs, totalAttempts),
    };
  }

  saveFactStatsMap(map);
}

export function summarizeDay(date: string): DailySummary {
  const attempts = getAttempts().filter((attempt) => dateOnly(attempt.timestamp) === date);
  const count = attempts.length;
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const accuracy = count > 0 ? correct / count : 0;
  const averageResponseTimeMs =
    count > 0 ? attempts.reduce((sum, attempt) => sum + attempt.responseTimeMs, 0) / count : 0;

  return {
    date,
    attempts: count,
    correct,
    accuracy,
    averageResponseTimeMs,
  };
}

export function getCompletedDates(): Set<string> {
  const set = new Set<string>();
  for (const attempt of getAttempts()) {
    set.add(dateOnly(attempt.timestamp));
  }
  return set;
}

export function getCurrentStreak(todayIsoDate: string): number {
  const completed = getCompletedDates();
  let streak = 0;

  const date = new Date(`${todayIsoDate}T00:00:00.000Z`);
  while (true) {
    const key = date.toISOString().slice(0, 10);
    if (!completed.has(key)) {
      break;
    }

    streak += 1;
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return streak;
}

export function getTodayTaskText(todaySummary: DailySummary): string {
  if (todaySummary.attempts >= 20) {
    return "Awesome! Daily goal complete. Try a 60-second challenge.";
  }

  return "Answer 20 multiplication questions or play the 60-second challenge.";
}

export function getTypeLabel(type: QuestionType): string {
  switch (type) {
    case "multiplication":
      return "Multiplication";
    case "addition":
      return "Addition";
    case "subtraction":
      return "Subtraction";
    case "division":
      return "Division";
    case "mixed":
      return "Mixed";
    default:
      return type;
  }
}
