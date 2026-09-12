"use client";

import { useMemo, useState } from "react";
import { getCompletedDates } from "@/lib/storage";

function dateKey(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    .toISOString()
    .slice(0, 10);
}

function getPastDays(total: number): Date[] {
  const days: Date[] = [];
  const today = new Date();

  for (let i = total - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  return days;
}

function countStreak(today: string, completedDates: Set<string>): number {
  let streak = 0;
  const date = new Date(`${today}T00:00:00.000Z`);

  while (true) {
    const key = date.toISOString().slice(0, 10);
    if (!completedDates.has(key)) {
      break;
    }

    streak += 1;
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return streak;
}

export default function CalendarPage() {
  const [completedDates] = useState<Set<string>>(() => getCompletedDates());

  const today = dateKey(new Date());
  const streak = useMemo(() => countStreak(today, completedDates), [today, completedDates]);
  const days = useMemo(() => getPastDays(35), []);

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
      <h1 className="text-3xl font-extrabold text-sky-900">Calendar & Streak</h1>
      <p className="mt-1 text-sm text-sky-800/80">Check in daily to grow your streak flame.</p>

      <section className="mt-4 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-200 p-4 shadow-lg ring-1 ring-amber-200">
        <p className="text-sm font-semibold text-orange-900">Current Streak</p>
        <p className="text-4xl font-black text-orange-950">{streak} days</p>
        <p className="mt-1 text-xs font-semibold text-orange-900">Each day with at least one practice answer counts.</p>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-sky-100">
        <h2 className="text-lg font-black text-sky-950">Last 5 Weeks</h2>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {days.map((day) => {
            const key = dateKey(day);
            const completed = completedDates.has(key);
            const isToday = key === today;

            return (
              <div
                key={key}
                className={`flex h-10 items-center justify-center rounded-xl text-xs font-bold ${
                  completed
                    ? "bg-emerald-400 text-emerald-950"
                    : "bg-slate-100 text-slate-500"
                } ${isToday ? "ring-2 ring-sky-500" : ""}`}
                title={key}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-700">
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-emerald-400" /> Done
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-slate-200" /> No practice
          </span>
        </div>
      </section>
    </main>
  );
}
