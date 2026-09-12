"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateOrderedMultiplicationQuestion } from "@/lib/math";
import { appendAttempts, getOrderedFactIndex, saveOrderedFactIndex, updateFactsFromAttempts } from "@/lib/storage";
import type { AnswerAttempt, PracticeQuestion } from "@/lib/types";

type Mode = "daily" | "sprint";

const DAILY_QUESTION_GOAL = 15;
const SPRINT_SECONDS = 60;

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function PracticePage() {
  const [mode, setMode] = useState<Mode>("daily");
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [initialSavedFactIndex] = useState<number>(() => getOrderedFactIndex());
  // Index within this session (0-based). Incremented per answered question.
  const [questionIndex, setQuestionIndex] = useState(0);
  // Where in the 45-fact table this session started. Fixed for the lifetime of one session.
  const [sessionStartIndex, setSessionStartIndex] = useState(0);
  // Last saved table position — used only for the pre-session progress display.
  const [savedFactIndex, setSavedFactIndex] = useState<number>(() => initialSavedFactIndex);
  const [sessionAttempts, setSessionAttempts] = useState<AnswerAttempt[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(SPRINT_SECONDS);

  const questionStartedAtRef = useRef<number>(0);
  const sessionAttemptsRef = useRef<AnswerAttempt[]>([]);

  useEffect(() => {
    sessionAttemptsRef.current = sessionAttempts;
  }, [sessionAttempts]);

  const persistSession = useCallback((attempts: AnswerAttempt[]) => {
    if (attempts.length === 0) {
      return;
    }

    appendAttempts(attempts);
    updateFactsFromAttempts(attempts);
  }, []);

  useEffect(() => {
    if (!started || mode !== "sprint") {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setStarted(false);
          setCurrentQuestion(null);
          persistSession(sessionAttemptsRef.current);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, mode, persistSession]);

  const sessionAccuracy = useMemo(() => {
    if (!sessionAttempts.length) {
      return 0;
    }

    const correct = sessionAttempts.filter((attempt) => attempt.isCorrect).length;
    return Math.round((correct / sessionAttempts.length) * 100);
  }, [sessionAttempts]);

  // Deterministic: table position = sessionStartIndex + qIdx (daily) or qIdx (sprint).
  // Both values are plain state — no ref, no stale-closure risk.
  function showQuestionAt(startIdx: number, qIdx: number) {
    const tableIdx = mode === "daily" ? startIdx + qIdx : qIdx;
    const question = generateOrderedMultiplicationQuestion(tableIdx);
    setCurrentQuestion(question);
    setQuestionIndex(qIdx);
    questionStartedAtRef.current = performance.now();
    setIsLocked(false);
    setFeedback("");
  }

  function startSession() {
    const startIdx = mode === "daily" ? getOrderedFactIndex() : 0;
    setSessionStartIndex(startIdx);
    setStarted(true);
    setSessionAttempts([]);
    setRemainingSeconds(SPRINT_SECONDS);
    // Pass startIdx directly — don't rely on setSessionStartIndex having flushed yet.
    const tableIdx = mode === "daily" ? startIdx : 0;
    const question = generateOrderedMultiplicationQuestion(tableIdx);
    setCurrentQuestion(question);
    setQuestionIndex(0);
    questionStartedAtRef.current = performance.now();
    setIsLocked(false);
    setFeedback("");
  }

  function handleAnswer(choice: number) {
    if (!currentQuestion || isLocked) {
      return;
    }

    const responseTimeMs = Math.round(performance.now() - questionStartedAtRef.current);
    const isCorrect = choice === currentQuestion.correctAnswer;

    const attempt: AnswerAttempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      questionType: currentQuestion.questionType,
      operands: currentQuestion.operands,
      correctAnswer: currentQuestion.correctAnswer,
      selectedAnswer: choice,
      isCorrect,
      responseTimeMs,
      timestamp: new Date().toISOString(),
    };

    const updatedAttempts = [...sessionAttempts, attempt];
    const nextQIdx = questionIndex + 1;
    const reachedQuestionCap = mode === "daily" && nextQIdx >= DAILY_QUESTION_GOAL;

    setSessionAttempts(updatedAttempts);
    setIsLocked(true);
    setFeedback(
      isCorrect
        ? `Awesome! ${currentQuestion.operands[0]} x ${currentQuestion.operands[1]} = ${currentQuestion.correctAnswer}`
        : `Keep going! ${currentQuestion.operands[0]} x ${currentQuestion.operands[1]} = ${currentQuestion.correctAnswer}`,
    );

    // Save progress to localStorage immediately.
    if (mode === "daily") {
      const nextTableIdx = sessionStartIndex + nextQIdx;
      saveOrderedFactIndex(nextTableIdx);
      setSavedFactIndex(nextTableIdx);
    }

    window.setTimeout(() => {
      if (reachedQuestionCap) {
        setStarted(false);
        setCurrentQuestion(null);
        persistSession(updatedAttempts);
      } else {
        // showQuestionAt uses sessionStartIndex from closure — it was set at session start
        // and never changes during a session, so it is always correct here.
        showQuestionAt(sessionStartIndex, nextQIdx);
      }
    }, 700);
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
      <h1 className="text-3xl font-extrabold text-sky-900">Practice</h1>
      <p className="mt-1 text-sm text-sky-800/80">One question at a time. Fast, fun, and focused.</p>

      <section className="mt-4 rounded-3xl bg-white/90 p-4 shadow-lg ring-1 ring-sky-100">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <button
            type="button"
            className={`rounded-2xl px-3 py-2 font-bold ${
              mode === "daily" ? "bg-sky-600 text-white" : "bg-sky-100 text-sky-900"
            }`}
            onClick={() => setMode("daily")}
            disabled={started}
          >
            Daily Quest
          </button>
          <button
            type="button"
            className={`rounded-2xl px-3 py-2 font-bold ${
              mode === "sprint" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-900"
            }`}
            onClick={() => setMode("sprint")}
            disabled={started}
          >
            60s Sprint
          </button>
        </div>

        {!started && !currentQuestion ? (
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 p-4">
            {mode === "daily" ? (
              <>
                <p className="text-xs font-semibold text-orange-700">Progress</p>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-orange-200">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${Math.round((savedFactIndex % 45) / 45 * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs font-semibold text-orange-800">
                  Fact {(savedFactIndex % 45) + 1} / 45 · {DAILY_QUESTION_GOAL} problems/session
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-orange-950">Answer as many as you can in 60 seconds!</p>
            )}
            <button
              type="button"
              onClick={startSession}
              className="mt-4 w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-extrabold text-white shadow-md"
            >
              {mode === "daily" ? "Start Practice" : "Start Sprint"}
            </button>
          </div>
        ) : null}

        {started && currentQuestion ? (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold text-sky-900">
              <span>Problem {questionIndex + 1}</span>
              <span>
                {mode === "daily"
                  ? `Fact #${((sessionStartIndex + questionIndex) % 45) + 1}/45`
                  : `${remainingSeconds}s`}
              </span>
            </div>

            <div className="rounded-2xl bg-sky-50 p-5 text-center">
              <p className="text-sm font-semibold text-sky-700">Solve</p>
              <p className="mt-1 text-4xl font-black text-sky-950">{currentQuestion.prompt}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {currentQuestion.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleAnswer(choice)}
                  disabled={isLocked}
                  className="rounded-2xl bg-white px-3 py-4 text-2xl font-black text-sky-900 shadow ring-1 ring-sky-100 disabled:opacity-70"
                >
                  {choice}
                </button>
              ))}
            </div>

            <p
              className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                feedback.startsWith("Awesome")
                  ? "bg-emerald-100 text-emerald-900"
                  : feedback
                    ? "bg-rose-100 text-rose-900"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {feedback || "Choose your answer"}
            </p>
          </div>
        ) : null}

        {!started && sessionAttempts.length > 0 ? (
          <div className="mt-4 rounded-2xl bg-emerald-100 p-4 text-emerald-950">
            <p className="text-lg font-black">Practice Complete!</p>
            <p className="mt-1 text-sm font-semibold">Accuracy: {sessionAccuracy}%</p>
            <p className="text-sm font-semibold">
              Avg Speed: {formatMs(sessionAttempts.reduce((s, a) => s + a.responseTimeMs, 0) / sessionAttempts.length)}
            </p>
            <Link
              href="/review"
              className="mt-3 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
            >
              Review
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
