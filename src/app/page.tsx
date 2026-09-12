"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getCurrentStreak, getTodayTaskText, summarizeDay } from "@/lib/storage";

function todayIsoDate(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
}

export default function Home() {
  const [homeMetrics] = useState(() => {
    const today = todayIsoDate();
    const summary = summarizeDay(today);

    return {
      todayAttempts: summary.attempts,
      todayAccuracy: summary.accuracy,
      todayAvgMs: summary.averageResponseTimeMs,
      streak: getCurrentStreak(today),
    };
  });

  const taskText = useMemo(() => {
    return getTodayTaskText({
      date: todayIsoDate(),
      attempts: homeMetrics.todayAttempts,
      correct: Math.round(homeMetrics.todayAttempts * homeMetrics.todayAccuracy),
      accuracy: homeMetrics.todayAccuracy,
      averageResponseTimeMs: homeMetrics.todayAvgMs,
    });
  }, [homeMetrics.todayAttempts, homeMetrics.todayAccuracy, homeMetrics.todayAvgMs]);

  const progressPercent = Math.min(100, Math.round((homeMetrics.todayAttempts / 20) * 100));

  return (
    <main className="px-4 pb-28 pt-5">
      <section className="rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-100">Today&apos;s Task</p>
        <h2 className="mt-1 text-2xl font-black leading-tight">{taskText}</h2>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <article className="rounded-2xl bg-white/20 p-2">
            <p className="text-[11px] font-bold uppercase text-sky-50">Streak</p>
            <p className="text-xl font-black">{homeMetrics.streak}</p>
          </article>
          <article className="rounded-2xl bg-white/20 p-2">
            <p className="text-[11px] font-bold uppercase text-sky-50">Accuracy</p>
            <p className="text-xl font-black">{Math.round(homeMetrics.todayAccuracy * 100)}%</p>
          </article>
          <article className="rounded-2xl bg-white/20 p-2">
            <p className="text-[11px] font-bold uppercase text-sky-50">Speed</p>
            <p className="text-xl font-black">
              {homeMetrics.todayAttempts ? `${(homeMetrics.todayAvgMs / 1000).toFixed(1)}s` : "-"}
            </p>
          </article>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/30">
          <div className="h-full rounded-full bg-amber-200" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="mt-2 text-xs font-semibold text-sky-100">
          Today progress: {homeMetrics.todayAttempts}/20 questions
        </p>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
        <Link
          href="/practice"
          className="block w-full rounded-2xl bg-orange-500 px-4 py-4 text-center text-lg font-black text-white shadow-md"
        >
          Start Practice
        </Link>

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Link href="/review" className="rounded-2xl bg-amber-100 px-3 py-3 text-center font-bold text-amber-900">
            Review
          </Link>
          <Link href="/calendar" className="rounded-2xl bg-sky-100 px-3 py-3 text-center font-bold text-sky-900">
            Calendar
          </Link>
          <Link href="/parent" className="rounded-2xl bg-emerald-100 px-3 py-3 text-center font-bold text-emerald-900">
            Parent Stats
          </Link>
        </div>

        <p className="mt-4 rounded-2xl bg-lime-100 p-3 text-sm font-semibold text-lime-950">
          Daily sessions are built for 3-5 minutes. Keep the streak alive with one quick check-in.
        </p>
      </section>
    </main>
  );
}
