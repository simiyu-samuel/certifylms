import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Lock, HelpCircle, Clock, ArrowLeft } from "lucide-react";
import { ExperienceQuizCard } from "../../quiz-card";
import { ModuleCompleteButton } from "../../module-complete";

function estimateReadingTime(content: string | null): number {
	if (!content) return 0;
	const words = content.split(/\s+/).length;
	return Math.max(1, Math.ceil(words / 200));
}

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
	const readingTime = estimateReadingTime(content);
	const isLocked = status === "locked";
	const isCompleted = status === "completed";
	const moduleCount = allModules.rows.length;

	return (
		<div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
			{/* Top bar */}
			<header
				className="border-b px-6 py-3 flex items-center gap-2"
				style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
			>
				<Link
					href={`/experiences/${experienceId}`}
					className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
					style={{ color: "var(--brand-ink-60)" }}
				>
					<ArrowLeft size={14} />
					{course?.title || "Course"}
				</Link>
				<span className="text-xs" style={{ color: "var(--brand-ink-30)" }}>/</span>
				<span className="text-xs font-semibold truncate" style={{ color: "var(--brand-ink)" }}>
					{moduleData.title}
				</span>
				<div className="flex-1" />
				<span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{
					backgroundColor: isCompleted ? "rgba(47,158,104,0.1)" : isLocked ? "var(--brand-chalk)" : "rgba(199,154,59,0.1)",
					color: isCompleted ? "var(--brand-verified-green)" : isLocked ? "var(--brand-ink-60)" : "var(--brand-seal-gold)",
				}}>
					{isCompleted ? "Completed" : isLocked ? "Locked" : `Module ${currentIdx + 1} of ${moduleCount}`}
				</span>
			</header>

			<main className="flex-1 p-6 max-w-3xl mx-auto w-full">
				{isLocked ? (
					<div
						className="rounded-xl p-10 border text-center"
						style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
					>
						<div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "var(--brand-chalk)" }}>
							<Lock size={30} style={{ color: "var(--brand-ink-30)" }} />
						</div>
						<h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
							Module Locked
						</h2>
						<p className="text-sm max-w-sm mx-auto" style={{ color: "var(--brand-ink-60)" }}>
							Complete the previous module and its quiz to unlock this content.
						</p>
						{prevModule && (
							<Link
								href={`/experiences/${experienceId}/module/${prevModule.id}`}
								className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
								style={{ backgroundColor: "var(--brand-seal-gold)" }}
							>
								<ChevronLeft size={16} />
								Go to previous module
							</Link>
						)}
					</div>
				) : (
					<>
						{/* Module header */}
						<div className="flex items-start gap-4 mb-6">
							<div
								className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
								style={{
									backgroundColor: isCompleted ? "var(--brand-verified-green)" : "var(--brand-seal-gold)",
								}}
							>
								{isCompleted ? (
									<CheckCircle2 size={22} className="text-white" />
								) : (
									<BookOpen size={22} className="text-white" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-0.5">
									<span className="text-xs font-mono font-medium" style={{ color: "var(--brand-ink-30)" }}>
										Module {currentIdx + 1}
									</span>
									{readingTime > 0 && (
										<span className="text-xs flex items-center gap-1" style={{ color: "var(--brand-ink-60)" }}>
											<Clock size={12} />
											{readingTime} min read
										</span>
									)}
								</div>
								<h1
									className="text-xl font-bold"
									style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
								>
									{moduleData.title}
								</h1>
							</div>
						</div>

						{/* Lesson content */}
						{content && (
							<div
								className="rounded-xl p-6 border mb-6"
								style={{
									backgroundColor: "white",
									borderColor: "var(--brand-ink-30)",
								}}
							>
								<div className="prose prose-sm max-w-none" style={{ color: "var(--brand-ink)" }}>
									{content.split("\n").map((line: string, i: number) => {
										if (line.startsWith("## ")) {
											return (
												<h3
													key={i}
													className="text-base font-bold mt-6 mb-3 first:mt-0"
													style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
												>
													{line.slice(3)}
												</h3>
											);
										}
										if (line.startsWith("- ")) {
											return (
												<li
													key={i}
													className="ml-5 mb-1.5 text-sm leading-relaxed"
													style={{ color: "var(--brand-ink-60)" }}
												>
													{line.slice(2)}
												</li>
											);
										}
										if (line.trim() === "") return <br key={i} />;
										return (
											<p
												key={i}
												className="text-sm leading-relaxed mb-3 last:mb-0"
												style={{ color: "var(--brand-ink-60)" }}
											>
												{line}
											</p>
										);
									})}
								</div>
							</div>
						)}

						{/* Quiz section */}
						{quizData && (
							<div
								className="rounded-xl p-6 border mb-6"
								style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
							>
								<div className="flex items-center gap-3 mb-4">
									<div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(199, 154, 59, 0.1)" }}>
										<HelpCircle size={16} style={{ color: "var(--brand-seal-gold)" }} />
									</div>
									<div>
										<h3 className="text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
											{quizData.title}
										</h3>
										<p className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
											Test your knowledge with this quiz
										</p>
									</div>
								</div>
								<ExperienceQuizCard
									experienceId={experienceId}
									quiz={quizData}
									questionCount={qCount}
									bestAttempt={bestAttempt}
									attemptCount={attemptCount}
								/>
							</div>
						)}

						{/* Complete button (no quiz modules) */}
						{!quizData && !isCompleted && (
							<div
								className="rounded-xl p-6 border mb-6 flex items-center justify-between"
								style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
							>
								<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
									Mark this module as complete when you are done reviewing the material.
								</p>
								<ModuleCompleteButton
									courseId={moduleData.course_id}
									moduleId={moduleId}
									moduleOrderIndex={moduleData.order_index}
								/>
							</div>
						)}

						{/* Navigation */}
						<div className="flex items-center justify-between pt-4">
							{prevModule ? (
								<Link
									href={`/experiences/${experienceId}/module/${prevModule.id}`}
									className="group flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl transition-all hover:bg-white"
									style={{ maxWidth: "45%" }}
								>
									<span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--brand-ink-30)" }}>
										<ChevronLeft size={12} className="inline mr-0.5" />
										Previous
									</span>
									<span className="text-sm font-medium truncate w-full" style={{ color: "var(--brand-ink-60)", }}>
										{prevModule.title}
									</span>
								</Link>
							) : (
								<div />
							)}
							{nextModule ? (
								<Link
									href={`/experiences/${experienceId}/module/${nextModule.id}`}
									className="group flex flex-col items-end gap-0.5 px-4 py-3 rounded-xl transition-all hover:bg-white"
									style={{ maxWidth: "45%" }}
								>
									<span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--brand-ink-30)" }}>
										Next
										<ChevronRight size={12} className="inline ml-0.5" />
									</span>
									<span className="text-sm font-medium truncate w-full text-right" style={{ color: "var(--brand-ink-60)" }}>
										{nextModule.title}
									</span>
								</Link>
							) : (
								<Link
									href={`/experiences/${experienceId}`}
									className="flex flex-col items-end gap-0.5 px-4 py-3 rounded-xl transition-all hover:bg-white"
								>
									<span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--brand-verified-green)" }}>
										Finish
									</span>
									<span className="text-sm font-medium" style={{ color: "var(--brand-ink-60)" }}>
										Back to course
										<ChevronRight size={12} className="inline ml-0.5" />
									</span>
								</Link>
							)}
						</div>
					</>
				)}
			</main>
		</div>
	);
}
