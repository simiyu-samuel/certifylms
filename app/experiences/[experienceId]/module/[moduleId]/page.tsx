import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Lock, HelpCircle } from "lucide-react";
import { ExperienceQuizCard } from "../../quiz-card";

export default async function ModulePage({
	params,
}: {
	params: Promise<{ experienceId: string; moduleId: string }>;
}) {
	const { experienceId, moduleId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());

	const mod = await query("SELECT * FROM modules WHERE id = $1", [moduleId]);
	if (mod.rows.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ backgroundColor: "var(--brand-chalk)" }}>
				<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>Module not found.</p>
				<Link href={`/experiences/${experienceId}`} className="text-sm font-medium" style={{ color: "var(--brand-seal-gold)" }}>
					Back to course
				</Link>
			</div>
		);
	}

	const moduleData = mod.rows[0];

	const experience = await whopsdk.experiences.retrieve(experienceId);
	const companyId = (experience as unknown as { company: { id: string } }).company.id;
	const courses = await query(
		"SELECT id, title FROM courses WHERE whop_company_id = $1 LIMIT 1",
		[companyId],
	);
	const course = courses.rows[0] || null;

	const allModules = await query(
		"SELECT id, title, order_index FROM modules WHERE course_id = $1 ORDER BY order_index ASC",
		[moduleData.course_id],
	);

	const currentIdx = allModules.rows.findIndex((m: { id: string }) => m.id === moduleId);
	const prevModule = currentIdx > 0 ? allModules.rows[currentIdx - 1] : null;
	const nextModule = currentIdx < allModules.rows.length - 1 ? allModules.rows[currentIdx + 1] : null;

	const quiz = await query("SELECT * FROM quizzes WHERE module_id = $1 LIMIT 1", [moduleId]);
	const quizData = quiz.rows[0] || null;

	let qCount = 0;
	let bestAttempt = null;
	let attemptCount = 0;

	if (quizData) {
		const qc = await query("SELECT COUNT(*) AS count FROM questions WHERE quiz_id = $1", [quizData.id]);
		qCount = Number(qc.rows[0].count);

		const attempts = await query(
			`SELECT * FROM attempts WHERE quiz_id = $1 AND whop_user_id = $2 AND submitted_at IS NOT NULL ORDER BY score_pct DESC`,
			[quizData.id, userId],
		);
		attemptCount = attempts.rows.length;
		bestAttempt = attempts.rows.find((a: { passed: boolean }) => a.passed) || null;
	}

	const progress = await query(
		"SELECT status FROM student_progress WHERE course_id = $1 AND whop_user_id = $2 AND module_id = $3",
		[moduleData.course_id, userId, moduleId],
	);
	const status = progress.rows[0]?.status || (moduleData.unlock_rule === "always" ? "unlocked" : "locked");

	const content = moduleData.content || null;

	return (
		<div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
			<header
				className="border-b px-6 py-3 flex items-center gap-3"
				style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
			>
				<Image src="/seal-mark-icon-dark.svg" alt="" width={22} height={22} />
				<div className="flex-1 flex items-center gap-3">
					<Link
						href={`/experiences/${experienceId}`}
						className="text-xs font-medium transition-colors hover:underline"
						style={{ color: "var(--brand-ink-60)" }}
					>
						{course?.title || "Course"}
					</Link>
					<span className="text-xs" style={{ color: "var(--brand-ink-30)" }}>/</span>
					<h1
						className="text-sm font-semibold truncate"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						{moduleData.title}
					</h1>
				</div>
				<div className="flex items-center gap-2">
					<span
						className="text-[10px] font-mono px-2 py-0.5 rounded-full"
						style={{ backgroundColor: status === "completed" ? "rgba(47,158,104,0.1)" : status === "locked" ? "var(--brand-chalk)" : "rgba(199,154,59,0.1)", color: status === "completed" ? "var(--brand-verified-green)" : status === "locked" ? "var(--brand-ink-60)" : "var(--brand-seal-gold)" }}
					>
						{status === "completed" ? "Completed" : status === "locked" ? "Locked" : "In Progress"}
					</span>
				</div>
			</header>

			<main className="flex-1 p-6 max-w-3xl mx-auto w-full">
				{status === "locked" ? (
					<div className="rounded-xl p-10 border text-center" style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}>
						<Lock size={40} className="mx-auto mb-4" style={{ color: "var(--brand-ink-30)" }} />
						<h2 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
							Module Locked
						</h2>
						<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
							Complete the previous module and quiz to unlock this content.
						</p>
					</div>
				) : (
					<>
						{content && (
							<div
								className="rounded-xl p-6 border mb-6 prose prose-sm max-w-none"
								style={{
									backgroundColor: "white",
									borderColor: "var(--brand-ink-30)",
									animation: "fadeInUp 0.3s ease",
								}}
							>
								<div className="flex items-center gap-2 mb-4">
									<BookOpen size={16} style={{ color: "var(--brand-seal-gold)" }} />
									<h2
										className="text-lg font-semibold m-0"
										style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
									>
										Lesson Content
									</h2>
								</div>
								<div
									className="leading-relaxed whitespace-pre-wrap"
									style={{ color: "var(--brand-ink)", fontSize: "0.9375rem", lineHeight: 1.7 }}
								>
									{content.split('\n').map((line: string, i: number) => {
										if (line.startsWith('## ')) {
											return <h3 key={i} className="text-base font-semibold mt-5 mb-2" style={{ color: "var(--brand-ink)" }}>{line.slice(3)}</h3>;
										}
										if (line.startsWith('- ')) {
											return <li key={i} className="ml-4 mb-1" style={{ color: "var(--brand-ink-60)" }}>{line.slice(2)}</li>;
										}
										if (line.trim() === '') return <br key={i} />;
										return <p key={i} className="mb-2" style={{ color: "var(--brand-ink-60)" }}>{line}</p>;
									})}
								</div>
							</div>
						)}

						{quizData && (
							<div
								className="rounded-xl p-6 border"
								style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
							>
								<h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--brand-ink)" }}>
									<HelpCircle size={14} style={{ color: "var(--brand-seal-gold)" }} />
									Quiz
								</h3>
								<ExperienceQuizCard
									experienceId={experienceId}
									quiz={quizData}
									questionCount={qCount}
									bestAttempt={bestAttempt}
									attemptCount={attemptCount}
								/>
							</div>
						)}

						{/* Module navigation */}
						<div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: "var(--brand-ink-30)" }}>
							{prevModule ? (
								<Link
									href={`/experiences/${experienceId}/module/${prevModule.id}`}
									className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white"
									style={{ color: "var(--brand-ink-60)" }}
								>
									<ChevronLeft size={16} />
									{prevModule.title}
								</Link>
							) : (
								<div />
							)}
							{nextModule ? (
								<Link
									href={`/experiences/${experienceId}/module/${nextModule.id}`}
									className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
									style={{ backgroundColor: "white", color: "var(--brand-seal-gold)", border: "1px solid var(--brand-ink-30)" }}
								>
									{nextModule.title}
									<ChevronRight size={16} />
								</Link>
							) : (
								<Link
									href={`/experiences/${experienceId}`}
									className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
									style={{ backgroundColor: "var(--brand-verified-green)" }}
								>
									<CheckCircle2 size={16} />
									Course Complete
								</Link>
							)}
						</div>
					</>
				)}
			</main>
		</div>
	);
}
