import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";
import {
	ChevronRight,
	BarChart3,
	Users,
	HelpCircle,
	CheckCircle2,
	XCircle,
	Download,
	ChevronLeft,
	BookOpen,
	FileText,
} from "lucide-react";
import { ManualGradeToggle } from "./manual-grade";

export default async function QuizGradebookPage({
	params,
}: {
	params: Promise<{ companyId: string; quizId: string }>;
}) {
	const { companyId, quizId } = await params;
	await whopsdk.verifyUserToken(await headers());

	const quiz = await query(
		`SELECT q.*, m.title AS module_title, m.course_id, c.title AS course_title
		 FROM quizzes q
		 JOIN modules m ON q.module_id = m.id
		 JOIN courses c ON m.course_id = c.id
		 WHERE q.id = $1 AND c.whop_company_id = $2`,
		[quizId, companyId],
	);
	if (quiz.rows.length === 0) notFound();

	const quizData = quiz.rows[0];

	const questions = await query(
		"SELECT id, type, prompt, correct_answer FROM questions WHERE quiz_id = $1 ORDER BY order_index",
		[quizId],
	);

	const attempts = await query(
		`SELECT id, whop_user_id, score_pct, passed, answers, submitted_at
		 FROM attempts WHERE quiz_id = $1 AND submitted_at IS NOT NULL
		 ORDER BY submitted_at DESC`,
		[quizId],
	);

	const totalAttempts = attempts.rows.length;
	const passedAttempts = attempts.rows.filter((a: { passed: boolean }) => a.passed).length;
	const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
	const avgScore = totalAttempts > 0
		? Math.round(attempts.rows.reduce((s: number, a: { score_pct: string }) => s + Number(a.score_pct), 0) / totalAttempts)
		: 0;

	const hasShortText = questions.rows.some((q: { type: string }) => q.type === "short_text");

	return (
		<div className="flex flex-col p-8 gap-6 max-w-6xl" style={{ animation: "fadeInUp 0.35s ease" }}>
			{/* Breadcrumb */}
			<div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--brand-ink-60)" }}>
				<Link href={`/dashboard/${companyId}/gradebook`} className="hover:underline flex items-center gap-1">
					<BarChart3 size={14} /> Gradebook
				</Link>
				<ChevronRight size={12} />
				<Link href={`/dashboard/${companyId}/courses/${quizData.course_id}`} className="hover:underline">
					{quizData.course_title}
				</Link>
				<ChevronRight size={12} />
				<span>{quizData.title}</span>
			</div>

			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
						{quizData.title}
					</h1>
					<p className="text-sm mt-0.5" style={{ color: "var(--brand-ink-60)" }}>
						{quizData.module_title} &middot; Pass threshold {Number(quizData.pass_threshold_pct)}% &middot; {questions.rows.length} question{questions.rows.length !== 1 ? "s" : ""}
						{quizData.max_attempts && <> &middot; Max {quizData.max_attempts} attempt{quizData.max_attempts !== 1 ? "s" : ""}</>}
						{quizData.time_limit_seconds && <> &middot; {Math.round(quizData.time_limit_seconds / 60)} min</>}
					</p>
				</div>
				<a
					href={`/api/gradebook/${quizId}/export`}
					className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
					style={{ backgroundColor: "var(--brand-chalk)", color: "var(--brand-ink)" }}
				>
					<Download size={15} />
					CSV
				</a>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4">
				{[
					{ label: "Attempts", value: String(totalAttempts), icon: Users, color: "var(--brand-seal-gold)" },
					{ label: "Pass Rate", value: passRate + "%", icon: CheckCircle2, color: "var(--brand-verified-green)" },
					{ label: "Avg Score", value: avgScore + "%", icon: BarChart3, color: "var(--brand-seal-gold)" },
				].map((stat, i) => {
					const Icon = stat.icon;
					return (
						<div key={stat.label}
							className="rounded-xl p-5 border flex flex-col gap-2 card-hover"
							style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)", animation: `fadeInUp 0.35s ease ${i * 0.06}s both` }}
						>
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium" style={{ color: "var(--brand-ink-60)" }}>{stat.label}</span>
								<Icon size={18} style={{ color: stat.color }} />
							</div>
							<span className="text-3xl font-bold" style={{ fontFamily: "var(--font-ibm-plex-mono)", color: "var(--brand-ink)" }}>
								{stat.value}
							</span>
						</div>
					);
				})}
			</div>

			{/* Attempts table */}
			{totalAttempts === 0 ? (
				<div className="rounded-xl p-12 border text-center" style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}>
					<div className="mb-4 flex justify-center">
						<div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-chalk)" }}>
							<FileText size={24} style={{ color: "var(--brand-ink-30)" }} />
						</div>
					</div>
					<p className="text-base font-semibold" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
						No attempts yet
					</p>
					<p className="text-sm mt-1" style={{ color: "var(--brand-ink-60)" }}>
						Students haven&apos;t submitted any attempts for this quiz.
					</p>
				</div>
			) : (
				<div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b" style={{ borderColor: "var(--brand-ink-30)", backgroundColor: "var(--brand-chalk)" }}>
									<th className="text-left px-4 py-3 font-medium text-xs" style={{ color: "var(--brand-ink-60)" }}>Student</th>
									<th className="text-left px-4 py-3 font-medium text-xs" style={{ color: "var(--brand-ink-60)" }}>Score</th>
									<th className="text-left px-4 py-3 font-medium text-xs" style={{ color: "var(--brand-ink-60)" }}>Passed</th>
									<th className="text-left px-4 py-3 font-medium text-xs" style={{ color: "var(--brand-ink-60)" }}>Submitted</th>
									<th className="text-left px-4 py-3 font-medium text-xs" style={{ color: "var(--brand-ink-60)" }}>Answers</th>
								</tr>
							</thead>
							<tbody>
								{attempts.rows.map((attempt: { id: string; whop_user_id: string; score_pct: string; passed: boolean; submitted_at: string; answers: unknown[] }, ai: number) => {
									const parsed = attempt.answers as { questionId: string; answer: string | string[]; correct: boolean }[];
									return (
										<tr key={attempt.id} className="border-b" style={{ borderColor: "var(--brand-ink-30)", animation: `fadeInUp 0.25s ease ${ai * 0.03}s both` }}>
											<td className="px-4 py-3">
												<span className="text-xs font-mono font-medium" style={{ color: "var(--brand-ink)" }}>
													{attempt.whop_user_id.slice(0, 12)}...
												</span>
											</td>
											<td className="px-4 py-3">
												<span className="font-mono font-bold" style={{ color: attempt.passed ? "var(--brand-verified-green)" : "var(--brand-brick)" }}>
													{Number(attempt.score_pct)}%
												</span>
											</td>
											<td className="px-4 py-3">
												{attempt.passed ? (
													<CheckCircle2 size={16} style={{ color: "var(--brand-verified-green)" }} />
												) : (
													<XCircle size={16} style={{ color: "var(--brand-brick)" }} />
												)}
											</td>
											<td className="px-4 py-3">
												<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
													{new Date(attempt.submitted_at).toLocaleDateString()}
												</span>
											</td>
											<td className="px-4 py-3 max-w-md">
												<details>
													<summary className="text-xs cursor-pointer font-medium" style={{ color: "var(--brand-seal-gold)" }}>
														View {parsed.length} answer{parsed.length !== 1 ? "s" : ""}
													</summary>
													<div className="mt-2 space-y-2">
														{parsed.map((a, qi) => {
															const question = questions.rows.find((q: { id: string }) => q.id === a.questionId);
															if (!question) return null;
															const displayAnswer = Array.isArray(a.answer) ? a.answer.join(", ") : a.answer;
															const isShortText = question.type === "short_text";
															return (
																<div key={a.questionId}
																	className="rounded-lg p-2.5 border"
																	style={{ backgroundColor: "var(--brand-chalk)", borderColor: "var(--brand-ink-30)" }}
																>
																	<div className="flex items-start justify-between gap-2">
																		<div className="flex-1 min-w-0">
																			<p className="text-[11px] font-medium mb-0.5" style={{ color: "var(--brand-ink)" }}>
																				{qi + 1}. {question.prompt}
																			</p>
																			<p className="text-[11px] font-mono" style={{ color: "var(--brand-ink-60)" }}>
																				Answer: {displayAnswer || <span className="italic">(blank)</span>}
																			</p>
																			{!isShortText && (
																				<p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--brand-ink-30)" }}>
																					Expected: {Array.isArray(question.correct_answer) ? question.correct_answer.join(", ") : String(question.correct_answer)}
																				</p>
																			)}
																		</div>
																		<div className="flex-shrink-0">
																			{isShortText ? (
																				<ManualGradeToggle
																					attemptId={attempt.id}
																					questionId={a.questionId}
																					answer={displayAnswer}
																					correct={a.correct}
																				/>
																			) : (
																				<span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded`}
																					style={{
																						backgroundColor: a.correct ? "rgba(47,158,104,0.1)" : "rgba(193,70,62,0.1)",
																						color: a.correct ? "var(--brand-verified-green)" : "var(--brand-brick)",
																					}}
																				>
																					{a.correct ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
																					{a.correct ? "Correct" : "Wrong"}
																				</span>
																			)}
																		</div>
																	</div>
																</div>
															);
														})}
													</div>
												</details>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
