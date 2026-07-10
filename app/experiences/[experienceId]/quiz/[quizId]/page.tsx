"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, AlertCircle, Flag } from "lucide-react";
import Image from "next/image";

type Question = {
	id: string;
	type: "multiple_choice" | "true_false" | "multi_select" | "short_text";
	prompt: string;
	options?: string[] | { true: string; false: string } | null;
};

type GradedAnswer = {
	questionId: string;
	answer: string | string[];
	correct: boolean;
};

type Result = {
	scorePct: number;
	passed: boolean;
	correctCount: number;
	totalQuestions: number;
	passThreshold: number;
	graded: GradedAnswer[];
};

export default function QuizPage({
	params,
}: {
	params: Promise<{ experienceId: string; quizId: string }>;
}) {
	const router = useRouter();
	const [experienceId, setExperienceId] = useState<string | null>(null);
	const [quizId, setQuizId] = useState<string | null>(null);
	const [attemptId, setAttemptId] = useState<string | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [timeLimit, setTimeLimit] = useState<number | null>(null);
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<Result | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		params.then((p) => {
			setExperienceId(p.experienceId);
			setQuizId(p.quizId);
			startAttempt(p.quizId);
		});
	}, [params]);

	async function startAttempt(qid: string) {
		try {
			setLoading(true);
			const res = await fetch(`/api/quizzes/${qid}/attempt`, { method: "POST" });
			if (!res.ok) {
				const body = await res.json();
				setError(body.error || "Failed to start attempt");
				return;
			}
			const data = await res.json();
			setAttemptId(data.attempt.id);
			setQuestions(data.questions);
			setTimeLimit(data.timeLimitSeconds);

			if (data.timeLimitSeconds) {
				setTimeRemaining(data.timeLimitSeconds);
			}

			const initial: Record<string, string | string[]> = {};
			for (const q of data.questions) {
				if (q.type === "multi_select") initial[q.id] = [];
				else initial[q.id] = "";
			}
			setAnswers(initial);
		} catch {
			setError("Failed to start quiz. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (timeRemaining == null || timeRemaining <= 0) return;
		const timer = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev == null || prev <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [timeRemaining]);

	const handleAnswer = useCallback(
		(questionId: string, value: string | string[]) => {
			setAnswers((prev) => ({ ...prev, [questionId]: value }));
		},
		[],
	);

	const handleSubmit = useCallback(async () => {
		if (!attemptId || submitting) return;
		setSubmitting(true);
		try {
			const res = await fetch(`/api/attempts/${attemptId}/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					answers: questions.map((q) => ({
						questionId: q.id,
						answer: answers[q.id] || "",
					})),
				}),
			});
			if (!res.ok) {
				setError("Failed to submit. Please try again.");
				setSubmitting(false);
				return;
			}
			const data = await res.json();
			setResult(data);
		} catch {
			setError("Failed to submit. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}, [attemptId, submitting, questions, answers]);

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-3" style={{ backgroundColor: "var(--brand-chalk)" }}>
				<div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--brand-seal-gold)", borderTopColor: "transparent" }} />
				<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>Loading quiz...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8" style={{ backgroundColor: "var(--brand-chalk)" }}>
				<AlertCircle size={40} style={{ color: "var(--brand-brick)" }} />
				<p className="text-sm font-medium" style={{ color: "var(--brand-brick)" }}>{error}</p>
				<button
					onClick={() => router.back()}
					className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					Go Back
				</button>
			</div>
		);
	}

	if (result) {
		return (
			<div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
				<div
					className="px-6 py-8 text-center"
					style={{
						backgroundColor: result.passed ? "var(--brand-verified-green)" : "var(--brand-brick)",
					}}
				>
					<div className="max-w-md mx-auto">
						{result.passed ? (
							<CheckCircle2 size={48} className="mx-auto mb-3 text-white" />
						) : (
							<XCircle size={48} className="mx-auto mb-3 text-white" />
						)}
						<h1
							className="text-2xl font-bold text-white mb-1"
							style={{ fontFamily: "var(--font-fraunces)" }}
						>
							{result.passed ? "Quiz Passed!" : "Quiz Failed"}
						</h1>
						<p className="text-white/80 text-sm">
							You scored {result.scorePct}% — {result.correctCount} of {result.totalQuestions} correct
							{result.passed
								? ` (pass: ${result.passThreshold}%)`
								: `. Pass threshold is ${result.passThreshold}%`}
						</p>
					</div>
				</div>

				<div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4">
					<button
						onClick={() => router.push(`/experiences/${experienceId}`)}
						className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
						style={{ color: "var(--brand-seal-gold)" }}
					>
						<ChevronLeft size={16} />
						Back to course
					</button>

					<h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
						Review Answers
					</h2>

					{result.graded.map((g, i) => {
						const q = questions[i];
						return (
							<div
								key={g.questionId}
								className="rounded-xl p-5 border"
								style={{
									backgroundColor: "white",
									borderColor: g.correct ? "rgba(47, 158, 104, 0.2)" : "rgba(181, 83, 63, 0.2)",
								}}
							>
								<div className="flex items-start gap-3">
									<div className="mt-0.5">
										{g.correct ? (
											<CheckCircle2 size={18} style={{ color: "var(--brand-verified-green)" }} />
										) : (
											<XCircle size={18} style={{ color: "var(--brand-brick)" }} />
										)}
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium mb-1" style={{ color: "var(--brand-ink)" }}>
											{i + 1}. {q.prompt}
										</p>
										<p className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
											Your answer: <span className="font-medium" style={{ color: g.correct ? "var(--brand-verified-green)" : "var(--brand-brick)" }}>
												{Array.isArray(g.answer) ? g.answer.join(", ") : g.answer || "(no answer)"}
											</span>
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	const current = questions[currentIndex];
	const isMulti = current?.type === "multi_select";
	const selected = answers[current?.id || ""] || (isMulti ? [] : "");
	const progress = questions.length > 0 ? ((Object.values(answers).filter((a) => (Array.isArray(a) ? a.length > 0 : a !== "")).length / questions.length) * 100) : 0;
	const timeWarning = timeRemaining != null && timeRemaining <= 120;

	return (
		<div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
			{/* Header */}
			<header
				className="border-b px-6 py-3 flex items-center gap-3"
				style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
			>
				<Image src="/seal-mark-icon-dark.svg" alt="" width={22} height={22} />
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h1
							className="text-sm font-semibold"
							style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
						>
							Quiz
						</h1>
						{timeLimit != null && timeRemaining != null && (
							<span
								className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full ${
									timeWarning ? "animate-pulse" : ""
								}`}
								style={{
									backgroundColor: timeWarning ? "rgba(181, 83, 63, 0.1)" : "var(--brand-chalk)",
									color: timeWarning ? "var(--brand-brick)" : "var(--brand-ink-60)",
								}}
							>
								<Clock size={12} />
								{formatTime(timeRemaining)}
							</span>
						)}
					</div>
				</div>
				<button
					onClick={() => router.push(`/experiences/${experienceId}`)}
					className="text-xs font-medium transition-colors hover:underline"
					style={{ color: "var(--brand-ink-60)" }}
				>
					Exit
				</button>
			</header>

			{/* Progress bar */}
			<div className="h-1" style={{ backgroundColor: "var(--brand-ink-30)" }}>
				<div
					className="h-full transition-all duration-300"
					style={{ width: `${progress}%`, backgroundColor: "var(--brand-seal-gold)" }}
				/>
			</div>

			<main className="flex-1 p-6 max-w-2xl mx-auto w-full">
				{/* Question nav dots */}
				<div className="flex items-center gap-2 mb-6 overflow-x-auto py-1">
					{questions.map((q, i) => {
						const isAnswered = Array.isArray(answers[q.id])
							? (answers[q.id] as string[]).length > 0
							: answers[q.id] !== "";
						const isActive = i === currentIndex;
						return (
							<button
								key={q.id}
								onClick={() => setCurrentIndex(i)}
								className="w-7 h-7 rounded-full text-[11px] font-mono font-medium transition-all flex-shrink-0"
								style={{
									backgroundColor: isActive
										? "var(--brand-seal-gold)"
										: isAnswered
											? "rgba(199, 154, 59, 0.15)"
											: "var(--brand-ink-30)",
									color: isActive ? "white" : isAnswered ? "var(--brand-seal-gold)" : "var(--brand-ink-60)",
									border: isActive ? "none" : "none",
								}}
							>
								{i + 1}
							</button>
						);
					})}
				</div>

				{current && (
					<div
						key={current.id}
						className="rounded-xl p-6 border"
						style={{
							backgroundColor: "white",
							borderColor: "var(--brand-ink-30)",
							animation: "fadeInUp 0.25s ease",
						}}
					>
						<div className="flex items-start gap-2 mb-4">
							<span
								className="text-xs font-mono px-2 py-0.5 rounded font-medium"
								style={{ backgroundColor: "var(--brand-chalk)", color: "var(--brand-ink-60)", whiteSpace: "nowrap" }}
							>
								{currentIndex + 1} / {questions.length}
							</span>
							<span
								className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
								style={{ backgroundColor: "rgba(199, 154, 59, 0.1)", color: "var(--brand-seal-gold)" }}
							>
								{current.type === "multiple_choice"
									? "Multiple Choice"
									: current.type === "true_false"
										? "True / False"
										: current.type === "multi_select"
											? "Multi Select"
											: "Short Answer"}
							</span>
						</div>

						<p className="text-base font-medium mb-5" style={{ color: "var(--brand-ink)" }}>
							{current.prompt}
						</p>

						{current.type === "multiple_choice" && Array.isArray(current.options) && (
							<div className="space-y-2">
								{current.options.map((opt) => (
									<button
										key={opt}
										onClick={() => handleAnswer(current.id, opt)}
										className="w-full text-left px-4 py-3 rounded-lg text-sm border transition-all"
										style={{
											backgroundColor: selected === opt ? "rgba(199, 154, 59, 0.08)" : "white",
											borderColor: selected === opt ? "var(--brand-seal-gold)" : "var(--brand-ink-30)",
											color: selected === opt ? "var(--brand-seal-gold)" : "var(--brand-ink)",
										}}
									>
										{opt}
									</button>
								))}
							</div>
						)}

						{current.type === "true_false" && (() => {
							const opts = current.options as { true: string; false: string } | undefined;
							const labels = opts || { true: "True", false: "False" };
							return (
								<div className="grid grid-cols-2 gap-3">
									{["true", "false"].map((val) => (
										<button
											key={val}
											onClick={() => handleAnswer(current.id, val)}
											className="px-4 py-3 rounded-lg text-sm border transition-all"
											style={{
												backgroundColor: selected === val ? "rgba(199, 154, 59, 0.08)" : "white",
												borderColor: selected === val ? "var(--brand-seal-gold)" : "var(--brand-ink-30)",
												color: selected === val ? "var(--brand-seal-gold)" : "var(--brand-ink)",
											}}
										>
											{labels[val as keyof typeof labels]}
										</button>
									))}
								</div>
							);
						})()}

						{current.type === "multi_select" && Array.isArray(current.options) && (
							<div className="space-y-2">
								{current.options.map((opt) => {
									const arr = Array.isArray(selected) ? selected : [];
									const isChecked = arr.includes(opt);
									return (
										<button
											key={opt}
											onClick={() => {
												const next = isChecked
													? arr.filter((a) => a !== opt)
													: [...arr, opt];
												handleAnswer(current.id, next);
											}}
											className="w-full text-left px-4 py-3 rounded-lg text-sm border transition-all"
											style={{
												backgroundColor: isChecked ? "rgba(199, 154, 59, 0.08)" : "white",
												borderColor: isChecked ? "var(--brand-seal-gold)" : "var(--brand-ink-30)",
												color: isChecked ? "var(--brand-seal-gold)" : "var(--brand-ink)",
											}}
										>
											{isChecked ? "☑ " : "☐ "}
											{opt}
										</button>
									);
								})}
							</div>
						)}

						{current.type === "short_text" && (
							<textarea
								value={typeof selected === "string" ? selected : ""}
								onChange={(e) => handleAnswer(current.id, e.target.value)}
								placeholder="Type your answer..."
								rows={4}
								className="w-full rounded-lg border px-4 py-3 text-sm resize-none focus:outline-none transition-all"
								style={{
									borderColor: selected ? "var(--brand-seal-gold)" : "var(--brand-ink-30)",
									color: "var(--brand-ink)",
								}}
							/>
						)}
					</div>
				)}

				{/* Navigation */}
				<div className="flex items-center justify-between mt-6">
					<button
						onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
						disabled={currentIndex === 0}
						className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
						style={{ color: "var(--brand-ink-60)" }}
					>
						<ChevronLeft size={16} />
						Previous
					</button>

					{currentIndex < questions.length - 1 ? (
						<button
							onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
							className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
							style={{ color: "var(--brand-seal-gold)" }}
						>
							Next
							<ChevronRight size={16} />
						</button>
					) : (
						<button
							onClick={handleSubmit}
							disabled={submitting}
							className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50"
							style={{ backgroundColor: "var(--brand-seal-gold)" }}
						>
							<Flag size={16} />
							{submitting ? "Submitting..." : "Submit"}
						</button>
					)}
				</div>
			</main>
		</div>
	);
}
