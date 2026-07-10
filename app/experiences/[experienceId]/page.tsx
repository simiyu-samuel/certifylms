import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";
import {
	Lock,
	CheckCircle2,
	Play,
	FileText,
	AlertCircle,
	HelpCircle,
	BarChart3,
	BookOpen,
	ChevronRight,
	ArrowRight,
} from "lucide-react";
import { ExperienceQuizCard } from "./quiz-card";
import { ModuleCompleteButton } from "./module-complete";

const unlockIcons = {
	always: Play,
	previous_quiz_passed: FileText,
	date: Lock,
};

async function getCourseForExperience(experienceId: string) {
	const experience = await whopsdk.experiences.retrieve(experienceId);
	const companyId = (experience as unknown as { company: { id: string } }).company.id;
	const courses = await query(
		"SELECT id, title, description, created_at FROM courses WHERE whop_company_id = $1 ORDER BY created_at DESC LIMIT 1",
		[companyId],
	);
	return { experience, companyId, course: courses.rows[0] || null };
}

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const [user, access] = await Promise.all([
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(experienceId, { id: userId }),
	]);

	if (!access) {
		return (
			<div className="flex flex-col items-center justify-center p-8 min-h-[60vh] gap-4">
				<Lock size={40} style={{ color: "var(--brand-brick)" }} />
				<p className="text-sm font-medium" style={{ color: "var(--brand-brick)" }}>
					You don't have access to this course.
				</p>
			</div>
		);
	}

	const { course } = await getCourseForExperience(experienceId);
	const displayName = user.name || `@${user.username}`;

	if (!course) {
		return (
			<div className="flex flex-col items-center justify-center p-8 min-h-[60vh] gap-4">
				<AlertCircle size={40} style={{ color: "var(--brand-ink-30)" }} />
				<p className="text-sm font-medium" style={{ color: "var(--brand-ink-60)" }}>
					No course is set up for this experience yet.
				</p>
			</div>
		);
	}

	const modules = await query(
		"SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index ASC",
		[course.id],
	);

	const quizRows = await query(
		"SELECT * FROM quizzes WHERE module_id = ANY($1::uuid[])",
		[modules.rows.map((m: { id: string }) => m.id)],
	);

	const quizMap = new Map<string, typeof quizRows.rows[0]>();
	for (const q of quizRows.rows) {
		quizMap.set(q.module_id, q);
	}

	const quizIds = [...quizMap.values()].map((q) => q.id);

	const [questionCounts, progressRows, attemptRows] = await Promise.all([
		query(
			"SELECT quiz_id, COUNT(*) AS count FROM questions WHERE quiz_id = ANY($1::uuid[]) GROUP BY quiz_id",
			[quizIds.length > 0 ? quizIds : ["00000000-0000-0000-0000-000000000000"]],
		),
		query(
			"SELECT module_id, status FROM student_progress WHERE course_id = $1 AND whop_user_id = $2",
			[course.id, userId],
		),
		query(
			`SELECT a.id, a.quiz_id, a.score_pct, a.passed, a.submitted_at
			 FROM attempts a WHERE a.quiz_id = ANY($1::uuid[]) AND a.whop_user_id = $2
			 ORDER BY a.submitted_at DESC NULLS LAST`,
			[quizIds.length > 0 ? quizIds : ["00000000-0000-0000-0000-000000000000"], userId],
		),
	]);

	const qCountMap = new Map(
		questionCounts.rows.map((r: { quiz_id: string; count: string }) => [r.quiz_id, r.count]),
	);
	const progressMap = new Map(
		progressRows.rows.map((r: { module_id: string; status: string }) => [r.module_id, r.status]),
	);
	const attemptMap = new Map<string, typeof attemptRows.rows>(),
		attemptCountMap = new Map<string, number>();
	const bestAttemptMap = new Map<string, typeof attemptRows.rows[0]>();
	for (const a of attemptRows.rows) {
		if (!attemptMap.has(a.quiz_id)) attemptMap.set(a.quiz_id, []);
		attemptMap.get(a.quiz_id)!.push(a);
		if (a.passed && !bestAttemptMap.has(a.quiz_id)) bestAttemptMap.set(a.quiz_id, a);
	}
	for (const [qid, attempts] of attemptMap) {
		attemptCountMap.set(qid, attempts.length);
	}

	const totalModules = modules.rows.length;
	const completedModules = modules.rows.filter((m: { id: string; unlock_rule: string }) => {
		const prog = progressMap.get(m.id) || (m.unlock_rule === "always" ? "unlocked" : "locked");
		return prog === "completed";
	}).length;
	const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
	const passedQuizzes = [...bestAttemptMap.values()].filter((a) => a.passed).length;
	const totalQuizzes = quizIds.length;

	const firstUnlocked = modules.rows.find((m: { id: string; unlock_rule: string }) => {
		const prog = progressMap.get(m.id) || (m.unlock_rule === "always" ? "unlocked" : "locked");
		return prog === "unlocked";
	});

	const justStarted = completedModules === 0 && !firstUnlocked;

	return (
		<div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
			{/* Simple top bar */}
			<header
				className="border-b px-6 py-3 flex items-center gap-2"
				style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
			>
				<Image src="/seal-mark-icon-dark.svg" alt="" width={20} height={20} />
				<span className="text-xs font-medium ml-1" style={{ color: "var(--brand-ink-60)" }}>
					CertifyLMS
				</span>
				<span className="text-xs" style={{ color: "var(--brand-ink-30)" }}>/</span>
				<span className="text-xs font-semibold truncate" style={{ color: "var(--brand-ink)" }}>
					{course.title}
				</span>
				<div className="flex-1" />
				<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
					{displayName}
				</span>
			</header>

			{/* Hero section */}
			<div
				className="px-6 py-10 border-b"
				style={{
					backgroundColor: "white",
					borderColor: "var(--brand-ink-30)",
				}}
			>
				<div className="max-w-3xl mx-auto">
					<div className="flex items-start gap-5">
						<div
							className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
							style={{ backgroundColor: "rgba(199, 154, 59, 0.12)" }}
						>
							<BookOpen size={28} style={{ color: "var(--brand-seal-gold)" }} />
						</div>
						<div className="flex-1 min-w-0">
							<h1
								className="text-2xl font-bold mb-1.5"
								style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
							>
								{course.title}
							</h1>
							{course.description && (
								<p className="text-sm leading-relaxed" style={{ color: "var(--brand-ink-60)" }}>
									{course.description}
								</p>
							)}
							<div className="flex items-center gap-4 mt-3">
								<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
									{totalModules} module{totalModules !== 1 ? "s" : ""}
								</span>
								{totalQuizzes > 0 && (
									<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
										{totalQuizzes} quiz{totalQuizzes !== 1 ? "zes" : ""}
									</span>
								)}
								{progressPct > 0 && (
									<span
										className="text-xs font-medium"
										style={{ color: progressPct === 100 ? "var(--brand-verified-green)" : "var(--brand-seal-gold)" }}
									>
										{progressPct}% complete
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Progress bar + stats */}
			{completedModules > 0 || progressPct > 0 ? (
				<div
					className="border-b px-6 py-4"
					style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
				>
					<div className="max-w-3xl mx-auto">
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs font-medium" style={{ color: "var(--brand-ink-60)" }}>
								Progress
							</span>
							<span
								className="text-xs font-mono font-medium"
								style={{ color: progressPct === 100 ? "var(--brand-verified-green)" : "var(--brand-seal-gold)" }}
							>
								{completedModules}/{totalModules}
							</span>
						</div>
						<div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--brand-chalk)" }}>
							<div
								className="h-full rounded-full transition-all duration-500"
								style={{
									width: `${progressPct}%`,
									backgroundColor: progressPct === 100 ? "var(--brand-verified-green)" : "var(--brand-seal-gold)",
								}}
							/>
						</div>
						<div className="flex items-center gap-6 mt-3">
							<div className="flex items-center gap-2">
								<CheckCircle2 size={14} style={{ color: "var(--brand-verified-green)" }} />
								<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
									{completedModules} module{completedModules !== 1 ? "s" : ""} done
								</span>
							</div>
							{totalQuizzes > 0 && (
								<div className="flex items-center gap-2">
									<HelpCircle size={14} style={{ color: "var(--brand-seal-gold)" }} />
									<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
										{passedQuizzes}/{totalQuizzes} passed
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			) : null}

			{/* Modules */}
			<main className="flex-1 p-6 max-w-3xl mx-auto w-full">
				{justStarted && modules.rows.length > 0 && (
					<div
						className="rounded-xl p-6 border mb-6 flex items-center justify-between"
						style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
					>
						<div className="flex items-center gap-3">
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center"
								style={{ backgroundColor: "rgba(199, 154, 59, 0.12)" }}
							>
								<Play size={18} style={{ color: "var(--brand-seal-gold)" }} />
							</div>
							<div>
								<p className="text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
									Start learning
								</p>
								<p className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
									Begin with module 1 and work your way through the course.
								</p>
							</div>
						</div>
						<Link
							href={`/experiences/${experienceId}/module/${modules.rows[0].id}`}
							className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
							style={{ backgroundColor: "var(--brand-seal-gold)" }}
						>
							Start
							<ArrowRight size={16} />
						</Link>
					</div>
				)}

				{completedModules === totalModules && totalModules > 0 && (
					<div
						className="rounded-xl p-6 border mb-6 text-center"
						style={{
							backgroundColor: "rgba(47, 158, 104, 0.06)",
							borderColor: "rgba(47, 158, 104, 0.2)",
						}}
					>
						<CheckCircle2 size={36} className="mx-auto mb-2" style={{ color: "var(--brand-verified-green)" }} />
						<h2 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-verified-green)" }}>
							Course Complete!
						</h2>
						<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
							You have completed all modules. Great work!
						</p>
					</div>
				)}

				<div className="space-y-3">
					{modules.rows.map((mod: typeof modules.rows[0], i: number) => {
						const UnlockIcon = unlockIcons[mod.unlock_rule as keyof typeof unlockIcons] || Lock;
						const progress = progressMap.get(mod.id) || (mod.unlock_rule === "always" ? "unlocked" : "locked");
						const quiz = quizMap.get(mod.id);
						const qCount = quiz ? Number(qCountMap.get(quiz.id) || 0) : 0;
						const bestAttempt = quiz ? bestAttemptMap.get(quiz.id) : undefined;
						const attemptCount = quiz ? attemptCountMap.get(quiz.id) || 0 : 0;
						const isLocked = progress === "locked";
						const hasContent = !!mod.content;
						const isCurrent = !isLocked && progress === "unlocked" && !bestAttempt?.passed;

						return (
							<div
								key={mod.id}
								className="rounded-xl border overflow-hidden transition-all card-hover"
								style={{
									backgroundColor: "white",
									borderColor: isCurrent ? "var(--brand-seal-gold)" : "var(--brand-ink-30)",
									opacity: isLocked ? 0.45 : 1,
									boxShadow: isCurrent ? "0 0 0 1px var(--brand-seal-gold)" : "none",
								}}
							>
								<Link
									href={isLocked ? "#" : `/experiences/${experienceId}/module/${mod.id}`}
									className={`block p-4 ${isLocked ? "pointer-events-none" : ""}`}
									aria-disabled={isLocked}
									tabIndex={isLocked ? -1 : undefined}
								>
									<div className="flex items-center gap-3">
										<div
											className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
											style={{
												backgroundColor:
													progress === "completed"
														? "var(--brand-verified-green)"
														: isLocked
															? "var(--brand-ink-30)"
															: "var(--brand-seal-gold)",
											}}
										>
											{progress === "completed" ? (
												<CheckCircle2 size={18} className="text-white" />
											) : (
												<UnlockIcon size={18} className="text-white" />
											)}
										</div>

										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="text-xs font-mono font-medium" style={{ color: "var(--brand-ink-30)" }}>
													{i + 1}
												</span>
												<span className="text-sm font-semibold truncate" style={{ color: "var(--brand-ink)" }}>
													{mod.title}
												</span>
												{isCurrent && (
													<span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "rgba(199, 154, 59, 0.1)", color: "var(--brand-seal-gold)" }}>
														current
													</span>
												)}
												{progress === "completed" && (
													<span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "rgba(47, 158, 104, 0.1)", color: "var(--brand-verified-green)" }}>
														done
													</span>
												)}
												{isLocked && (
													<span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "var(--brand-chalk)", color: "var(--brand-ink-60)" }}>
														locked
													</span>
												)}
											</div>

											{!isLocked && (
												<div className="flex items-center gap-3 mt-1.5">
													{hasContent && (
														<span className="text-xs flex items-center gap-1" style={{ color: "var(--brand-ink-60)" }}>
															<BookOpen size={12} />
															Lesson
														</span>
													)}
													{quiz && (
														<span className="text-xs flex items-center gap-1" style={{ color: "var(--brand-ink-60)" }}>
															<HelpCircle size={12} />
															{qCount} question{qCount !== 1 ? "s" : ""}
														</span>
													)}
													{mod.unlock_rule === "previous_quiz_passed" && !isLocked && (
														<span className="text-xs font-medium" style={{ color: "var(--brand-seal-gold)" }}>
															Gated — requires previous quiz
														</span>
													)}
												</div>
											)}
										</div>

										{!isLocked && (
											<ChevronRight size={16} style={{ color: "var(--brand-ink-30)", flexShrink: 0 }} />
										)}
									</div>
								</Link>

								{quiz && !isLocked && (
									<div
										className="border-t px-4 py-3"
										style={{ borderColor: "var(--brand-ink-30)" }}
									>
										<ExperienceQuizCard
											experienceId={experienceId}
											quiz={quiz}
											questionCount={qCount}
											bestAttempt={bestAttempt || null}
											attemptCount={attemptCount}
										/>
									</div>
								)}

								{!quiz && !isLocked && progress !== "completed" && (
									<div
										className="border-t px-4 py-3 flex items-center justify-end"
										style={{ borderColor: "var(--brand-ink-30)" }}
									>
										<ModuleCompleteButton
											courseId={course.id}
											moduleId={mod.id}
											moduleOrderIndex={mod.order_index}
										/>
									</div>
								)}
							</div>
						);
					})}
				</div>

				{/* Course complete footer */}
				{completedModules === totalModules && totalModules > 0 && (
					<div className="text-center mt-8 mb-4">
						<div
							className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
							style={{ backgroundColor: "var(--brand-verified-green)" }}
						>
							<CheckCircle2 size={18} />
							Certificate available
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
