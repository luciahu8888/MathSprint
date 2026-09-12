"use client";

import { useMemo, useState } from "react";
import { getAttempts, getFactStatsMap } from "@/lib/storage";
import type { AnswerAttempt, FactStats } from "@/lib/types";

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function last7Days(): string[] {
  const result: string[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10));
  }

  return result;
}

export default function ParentStatsPage() {
  const [attempts] = useState<AnswerAttempt[]>(() => getAttempts());
  const [factStats] = useState<Record<string, FactStats>>(() => getFactStatsMap());

  const accuracy = useMemo(() => {
    if (!attempts.length) {
      return 0;
    }
    return attempts.filter((attempt) => attempt.isCorrect).length / attempts.length;
  }, [attempts]);

  const averageResponseTime = useMemo(() => {
    if (!attempts.length) {
      return 0;
    }
    return attempts.reduce((sum, attempt) => sum + attempt.responseTimeMs, 0) / attempts.length;
  }, [attempts]);

  const mostMissed = useMemo(() => {
    return Object.values(factStats)
      .filter((fact) => fact.incorrectAttempts > 0)
      .sort((a, b) => b.incorrectAttempts - a.incorrectAttempts)
      .slice(0, 5);
  }, [factStats]);

  const slowestFacts = useMemo(() => {
    return Object.values(factStats)
      .filter((fact) => fact.totalAttempts >= 2)
      .sort((a, b) => b.averageResponseTimeMs - a.averageResponseTimeMs)
      .slice(0, 5);
  }, [factStats]);

  const weeklyProgress = useMemo(() => {
    const days = last7Days();

    return days.map((day) => {
      const dayAttempts = attempts.filter((attempt) => dayKey(attempt.timestamp) === day);
      const correct = dayAttempts.filter((attempt) => attempt.isCorrect).length;

      return {
        day,
        attempts: dayAttempts.length,
        accuracy: dayAttempts.length ? correct / dayAttempts.length : 0,
      };
    });
  }, [attempts]);

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
      <h1 className="text-3xl font-extrabold text-sky-900">Parent Stats</h1>
      <p className="mt-1 text-sm text-sky-800/80">Quick view of fluency and confidence trends.</p>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <article className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
          <p className="text-xs font-semibold text-sky-700">Accuracy</p>
          <p className="text-2xl font-black text-sky-950">{percent(accuracy)}</p>
        </article>
        <article className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
          <p className="text-xs font-semibold text-sky-700">Avg Response</p>
          <p className="text-2xl font-black text-sky-950">{(averageResponseTime / 1000).toFixed(1)}s</p>
        </article>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
        <h2 className="text-lg font-black text-rose-950">Most Missed Facts</h2>
        {mostMissed.length === 0 ? (
          <p className="mt-2 text-sm text-slate-700">No misses yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {mostMissed.map((fact) => (
              <li key={fact.key} className="rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-950">
                {fact.operands[0]} x {fact.operands[1]} • missed {fact.incorrectAttempts} times
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
        <h2 className="text-lg font-black text-indigo-950">Slowest Facts</h2>
        {slowestFacts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-700">Need more practice attempts.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {slowestFacts.map((fact) => (
              <li key={fact.key} className="rounded-2xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-950">
                {fact.operands[0]} x {fact.operands[1]} • {(fact.averageResponseTimeMs / 1000).toFixed(1)}s average
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
        <h2 className="text-lg font-black text-emerald-950">Weekly Progress</h2>
        <ul className="mt-3 space-y-2">
          {weeklyProgress.map((day) => (
            <li key={day.day} className="rounded-2xl bg-emerald-50 px-3 py-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span>{day.day.slice(5)}</span>
                <span>
                  {day.attempts} tries • {percent(day.accuracy)}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded bg-emerald-100">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.round(day.accuracy * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
