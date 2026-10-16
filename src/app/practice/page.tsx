"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  generateShuffledDivisionFactQuestions,
  generateLargeSmallMultiplicationQuestion,
  generateOrderedMultiplicationQuestion,
  generateShuffledDailyQuestQuestions,
} from "@/lib/math";
import { DAILY_MULTIPLICATION_GOAL, appendAttempts, updateFactsFromAttempts } from "@/lib/storage";
import type { AnswerAttempt, PracticeMode, PracticeQuestion } from "@/lib/types";

const DIVISION_FACT_QUESTION_GOAL = 45;
const LARGE_SMALL_QUESTION_GOAL = 45;

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function PracticePage() {
  const [mode, setMode] = useState<PracticeMode>("daily");
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState<AnswerAttempt[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);

  const dailyQuestionsRef = useRef<PracticeQuestion[]>([]);
  const divisionQuestionsRef = useRef<PracticeQuestion[]>([]);
  const questionStartedAtRef = useRef<number>(0);

  const persistSession = useCallback((attempts: AnswerAttempt[]) => {
    if (attempts.length === 0) {
      return;
    }

    appendAttempts(attempts);
    updateFactsFromAttempts(attempts);
  }, []);

  const sessionAccuracy = useMemo(() => {
    if (!sessionAttempts.length) {
      return 0;
    }

    const correct = sessionAttempts.filter((attempt) => attempt.isCorrect).length;
    return Math.round((correct / sessionAttempts.length) * 100);
  }, [sessionAttempts]);

  function getQuestionForMode(nextMode: PracticeMode, qIdx: number): PracticeQuestion {
    if (nextMode === "daily") {
      return dailyQuestionsRef.current[qIdx] ?? generateOrderedMultiplicationQuestion(qIdx);
    }

    if (nextMode === "division-facts") {
      return divisionQuestionsRef.current[qIdx] ?? generateShuffledDivisionFactQuestions()[qIdx];
    }

    if (nextMode === "large-small") {
      return generateLargeSmallMultiplicationQuestion();
    }

    return generateOrderedMultiplicationQuestion(qIdx);
  }

  function showQuestionAt(qIdx: number) {
    const question = getQuestionForMode(mode, qIdx);
    setCurrentQuestion(question);
    setQuestionIndex(qIdx);
    questionStartedAtRef.current = performance.now();
    setIsLocked(false);
    setFeedback("");
  }

  function startSession() {
    if (mode === "daily") {
      dailyQuestionsRef.current = generateShuffledDailyQuestQuestions();
    }

    if (mode === "division-facts") {
      divisionQuestionsRef.current = generateShuffledDivisionFactQuestions();
    }

    setStarted(true);
    setSessionAttempts([]);
    const question = getQuestionForMode(mode, 0);
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
      practiceMode: mode,
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
    const reachedQuestionCap =
      (mode === "daily" && nextQIdx >= DAILY_MULTIPLICATION_GOAL) ||
      (mode === "division-facts" && nextQIdx >= DIVISION_FACT_QUESTION_GOAL) ||
      (mode === "large-small" && nextQIdx >= LARGE_SMALL_QUESTION_GOAL);

    setSessionAttempts(updatedAttempts);
    setIsLocked(true);
    setFeedback(
      isCorrect
      ? `Awesome! ${currentQuestion.prompt.replace(" = ?", "")} = ${currentQuestion.correctAnswer}`
      : `Keep going! ${currentQuestion.prompt.replace(" = ?", "")} = ${currentQuestion.correctAnswer}`,
    );

    window.setTimeout(() => {
      if (reachedQuestionCap) {
        setStarted(false);
        setCurrentQuestion(null);
        persistSession(updatedAttempts);
      } else {
        showQuestionAt(nextQIdx);
      }
    }, 700);
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
      <h1 className="text-3xl font-extrabold text-sky-900">Practice</h1>
      <p className="mt-1 text-sm text-sky-800/80">One question at a time. Fast, fun, and focused.</p>

      <section className="mt-4 rounded-3xl bg-white/90 p-4 shadow-lg ring-1 ring-sky-100">
        <div className="grid grid-cols-3 gap-2 text-sm">
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
              mode === "division-facts" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-900"
            }`}
            onClick={() => setMode("division-facts")}
            disabled={started}
          >
            Division Facts
          </button>
          <button
            type="button"
            className={`rounded-2xl px-3 py-2 font-bold ${
              mode === "large-small" ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-900"
            }`}
            onClick={() => setMode("large-small")}
            disabled={started}
          >
            Big x Small
          </button>
        </div>

        {!started && !currentQuestion ? (
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 p-4">
            {mode === "daily" ? (
              <>
                <p className="text-sm font-semibold text-orange-950">Practice all 45 multiplication facts in a shuffled order.</p>
                <p className="mt-1 text-xs font-semibold text-orange-800">{DAILY_MULTIPLICATION_GOAL} problems/session</p>
              </>
            ) : mode === "division-facts" ? (
              <>
                <p className="text-sm font-semibold text-orange-950">Practice multiplication-table division in a shuffled order.</p>
                <p className="mt-1 text-xs font-semibold text-orange-800">{DIVISION_FACT_QUESTION_GOAL} problems/session</p>
              </>
            ) : mode === "large-small" ? (
              <>
                <p className="text-sm font-semibold text-orange-950">Practice one-digit multiplication with the bigger number first, like 6 x 5.</p>
                <p className="mt-1 text-xs font-semibold text-orange-800">{LARGE_SMALL_QUESTION_GOAL} problems/session</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-orange-950">Answer as many as you can in 60 seconds!</p>
            )}
            <button
              type="button"
              onClick={startSession}
              className="mt-4 w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-extrabold text-white shadow-md"
            >
              {mode === "daily"
                ? "Start Practice"
                : mode === "division-facts"
                  ? "Start Division"
                  : "Start Big x Small"}
            </button>
          </div>
        ) : null}

        {started && currentQuestion ? (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold text-sky-900">
              <span>Problem {questionIndex + 1}</span>
              <span>
                {mode === "daily"
                  ? `${questionIndex + 1}/${DAILY_MULTIPLICATION_GOAL}`
                  : mode === "division-facts"
                    ? `${questionIndex + 1}/${DIVISION_FACT_QUESTION_GOAL}`
                    : `${questionIndex + 1}/${LARGE_SMALL_QUESTION_GOAL}`}
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
