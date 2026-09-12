"use client";

import { useMemo, useState } from "react";
import { getAttempts, getFactStatsMap } from "@/lib/storage";
import type { AnswerAttempt, FactStats } from "@/lib/types";

const PRIORITY_KEYS = new Set(["multiplication:6x7", "multiplication:7x8", "multiplication:8x9", "multiplication:9x7"]);

function formatFact(operands: [number, number]): string {
  return `${operands[0]} x ${operands[1]}`;
}

export default function ReviewPage() {
  const [attempts] = useState<AnswerAttempt[]>(() => getAttempts());
  const [factStats] = useState<Record<string, FactStats>>(() => getFactStatsMap());

  const missed = useMemo(
    () => attempts.filter((attempt) => !attempt.isCorrect).slice(-20).reverse(),
    [attempts],
  );

  const slowCorrect = useMemo(
    () => attempts.filter((attempt) => attempt.isCorrect && attempt.responseTimeMs > 4500).slice(-20).reverse(),
    [attempts],
  );

  const weakFacts = useMemo(() => {
    return Object.values(factStats)
      .filter((fact) => fact.questionType === "multiplication")
      .sort((a, b) => {
        const aPriority = PRIORITY_KEYS.has(a.key) ? 1 : 0;
        const bPriority = PRIORITY_KEYS.has(b.key) ? 1 : 0;
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        if (a.masteryLevel !== b.masteryLevel) {
          const rank = { new: 0, learning: 1, steady: 2, mastered: 3 };
          return rank[a.masteryLevel] - rank[b.masteryLevel];
        }

        if (a.incorrectAttempts !== b.incorrectAttempts) {
          return b.incorrectAttempts - a.incorrectAttempts;
        }

        return b.averageResponseTimeMs - a.averageResponseTimeMs;
      })
      .slice(0, 8);
  }, [factStats]);

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
      <h1 className="text-3xl font-extrabold text-sky-900">Review</h1>
      <p className="mt-1 text-sm text-sky-800/80">Practice your trickiest facts first.</p>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
        <h2 className="text-lg font-black text-sky-950">Weak Facts</h2>
        {weakFacts.length === 0 ? (
          <p className="mt-2 text-sm text-sky-800">No weak facts yet. Complete a practice session first.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {weakFacts.map((fact) => (
              <li key={fact.key} className="rounded-2xl bg-amber-50 px-3 py-2">
                <p className="font-black text-amber-950">{formatFact(fact.operands)}</p>
                <p className="text-xs font-semibold text-amber-900">
                  Mastery: {fact.masteryLevel} • Missed: {fact.incorrectAttempts} • Avg time: {Math.round(fact.averageResponseTimeMs)}ms
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
        <h2 className="text-lg font-black text-rose-950">Missed Questions</h2>
        {missed.length === 0 ? (
          <p className="mt-2 text-sm text-slate-700">No misses yet. Keep going!</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {missed.map((attempt) => (
              <li key={attempt.id} className="rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-950">
                {formatFact(attempt.operands)} = {attempt.correctAnswer}, you picked {attempt.selectedAnswer}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
        <h2 className="text-lg font-black text-indigo-950">Slow But Correct</h2>
        {slowCorrect.length === 0 ? (
          <p className="mt-2 text-sm text-slate-700">None yet. Nice speed!</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {slowCorrect.map((attempt) => (
              <li key={attempt.id} className="rounded-2xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-950">
                {formatFact(attempt.operands)} in {(attempt.responseTimeMs / 1000).toFixed(1)}s
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
