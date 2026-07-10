"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ChevronLeft, AlertCircle } from "lucide-react";
import Image from "next/image";

type Q = {
	id: string;
	type: string;
	prompt: string;
	options: unknown;
	correct_answer: string | string[];
};

type Attempt = {
	id: string;
	score_pct: string;
	passed: boolean;
	answers: string;
	submitted_at: string;
};

export default function QuizReviewPage({
	params,
}: {
	params: Promise<{ experienceId: string; quizId: string }>;
}) {
	const router = useRouter();
	const [experienceId, setExperienceId] = useState("");
	const [attempt, setAttempt] = useState<Attempt | null>(null);
	const [questions, setQuestions] = useState<Q[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		params.then((p) => {
			setExperienceId(p.experienceId);
			fetchLastAttempt(p.quizId);
		});
	}, [params]);

	async function fetchLastAttempt(quizId: string) {
		try {
			const res = await fetch(`/api/quizzes/${quizId}/last-attempt`);
			if (!res.ok) {
				setError("No attempts found for this quiz.");
				return;
			}
			const data = await res.json();
			setAttempt(data.attempt);
			setQuestions(data.questions);
		} catch {
			setError("Failed to load review data.");
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
				<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>Loading review...</p>
			</div>
		);
	}

	if (error || !attempt) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ backgroundColor: "var(--brand-chalk)" }}>
				<AlertCircle size={36} style={{ color: "var(--brand-ink-30)" }} />
				<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>{error || "No data available"}</p>
				<button
					onClick={() => router.back()}
					className="px-4 py-2 rounded-lg text-sm font-medium text-white"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					Go Back
				</button>
			</div>
		);
	}

	const graded = (typeof attempt.answers === "string" ? JSON.parse(attempt.answers) : attempt.answers) as Array<{
		questionId: string;
		answer: string | string[];
		correct: boolean;
	}>;

	return (
		<div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
			<div
				className="px-6 py-6 text-center"
				style={{ backgroundColor: attempt.passed ? "var(--brand-verified-green)" : "var(--brand-brick)" }}
			>
				<div className="max-w-md mx-auto">
					{attempt.passed ? (
						<CheckCircle2 size={40} className="mx-auto mb-2 text-white" />
					) : (
						<XCircle size={40} className="mx-auto mb-2 text-white" />
					)}
					<h1
						className="text-xl font-bold text-white mb-1"
						style={{ fontFamily: "var(--font-fraunces)" }}
					>
						{attempt.passed ? "Quiz Passed!" : "Quiz Failed"}
					</h1>
					<p className="text-white/80 text-sm">
						Score: {attempt.score_pct}% — Submitted{" "}
						{new Date(attempt.submitted_at).toLocaleDateString()}
					</p>
				</div>
			</div>

			<div className="flex-1 p-6 max-w-2xl mx-auto w-full">
				<button
					onClick={() => router.push(`/experiences/${experienceId}`)}
					className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline mb-6"
					style={{ color: "var(--brand-seal-gold)" }}
				>
					<ChevronLeft size={16} />
					Back to course
				</button>

				<h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
					Review Answers
				</h2>

				<div className="space-y-3">
					{questions.map((q, i) => {
						const g = graded.find((g) => g.questionId === q.id);
						const userAnswer = g?.answer ?? "(no answer)";
						const correct = g?.correct ?? false;
						return (
							<div
								key={q.id}
								className="rounded-xl p-5 border"
								style={{
									backgroundColor: "white",
									borderColor: correct ? "rgba(47, 158, 104, 0.2)" : "rgba(181, 83, 63, 0.2)",
								}}
							>
								<div className="flex items-start gap-3">
									<div className="mt-0.5 flex-shrink-0">
										{correct ? (
											<CheckCircle2 size={18} style={{ color: "var(--brand-verified-green)" }} />
										) : (
											<XCircle size={18} style={{ color: "var(--brand-brick)" }} />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium mb-1.5" style={{ color: "var(--brand-ink)" }}>
											{i + 1}. {q.prompt}
										</p>
										<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
											<span style={{ color: "var(--brand-ink-60)" }}>
												Your answer:{" "}
												<span className="font-medium" style={{ color: correct ? "var(--brand-verified-green)" : "var(--brand-brick)" }}>
													{Array.isArray(userAnswer) ? userAnswer.join(", ") : String(userAnswer)}
												</span>
											</span>
											{!correct && (
												<span style={{ color: "var(--brand-ink-60)" }}>
													Correct:{" "}
													<span className="font-medium" style={{ color: "var(--brand-verified-green)" }}>
														{Array.isArray(q.correct_answer) ? q.correct_answer.join(", ") : String(q.correct_answer)}
													</span>
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div className="flex justify-center mt-8">
					<button
						onClick={() => router.push(`/experiences/${experienceId}`)}
						className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						Back to Course
					</button>
				</div>
			</div>
		</div>
	);
}
