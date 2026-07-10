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
} from "lucide-react";
import { ExperienceQuizCard } from "./quiz-card";

const unlockIcons = {
	always: Play,
	previous_quiz_passed: FileText,
	date: Lock,
};

async function getCourseForExperience(experienceId: string) {
	const experience = await whopsdk.experiences.retrieve(experienceId);
	const companyId = (experience as unknown as { company_id: string }).company_id;
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

	return (
		<div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
			{/* Header */}
			<header
				className="border-b px-6 py-4 flex items-center gap-3"
				style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
			>
				<Image src="/seal-mark-icon-dark.svg" alt="" width={28} height={28} />
				<div className="flex-1">
					<h1
						className="text-lg font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						{course.title}
					</h1>
					<p className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
						{displayName}
					</p>
				</div>
				{course.description && (
					<p className="text-xs max-w-xs text-right" style={{ color: "var(--brand-ink-60)" }}>
						{course.description}
					</p>
				)}
			</header>

			{/* Modules */}
			<main className="flex-1 p-6 max-w-3xl mx-auto w-full">
				<div className="flex items-center gap-3 mb-6">
					<h2
						className="text-xl font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Course Modules
					</h2>
					<span
						className="text-xs font-mono px-2 py-0.5 rounded-full"
						style={{ backgroundColor: "var(--brand-chalk)", color: "var(--brand-ink-60)" }}
					>
						{modules.rows.length} module{modules.rows.length !== 1 ? "s" : ""}
					</span>
				</div>

				<div className="space-y-4">
					{modules.rows.map((mod: typeof modules.rows[0], i: number) => {
						const UnlockIcon = unlockIcons[mod.unlock_rule as keyof typeof unlockIcons] || Lock;
						const progress = progressMap.get(mod.id) || (mod.unlock_rule === "always" ? "unlocked" : "locked");
						const quiz = quizMap.get(mod.id);
						const qCount = quiz ? Number(qCountMap.get(quiz.id) || 0) : 0;
						const bestAttempt = quiz ? bestAttemptMap.get(quiz.id) : undefined;
						const attemptCount = quiz ? attemptCountMap.get(quiz.id) || 0 : 0;

						return (
							<div
								key={mod.id}
								className="rounded-xl border overflow-hidden"
								style={{
									backgroundColor: "white",
									borderColor: "var(--brand-ink-30)",
									opacity: progress === "locked" ? 0.6 : 1,
								}}
							>
								<div className="p-5">
									<div className="flex items-start gap-3">
										<div
											className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
											style={{
												backgroundColor:
													progress === "completed"
														? "var(--brand-verified-green)"
														: progress === "unlocked"
															? "var(--brand-seal-gold)"
															: "var(--brand-ink-30)",
											}}
										>
											{progress === "completed" ? (
												<CheckCircle2 size={16} className="text-white" />
											) : (
												<UnlockIcon size={16} className="text-white" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-0.5">
												<span
													className="text-xs font-mono"
													style={{ color: "var(--brand-ink-60)" }}
												>
													{i + 1}.
												</span>
												<h3
													className="font-semibold truncate"
													style={{ color: "var(--brand-ink)" }}
												>
													{mod.title}
												</h3>
												{mod.unlock_rule === "previous_quiz_passed" && (
													<span
														className="text-[10px] px-1.5 py-0.5 rounded font-medium"
														style={{
															backgroundColor: "var(--brand-chalk)",
															color: "var(--brand-seal-gold)",
														}}
													>
														gated
													</span>
												)}
												{progress === "completed" && (
													<span
														className="text-[10px] px-1.5 py-0.5 rounded font-medium"
														style={{
															backgroundColor: "rgba(47, 158, 104, 0.1)",
															color: "var(--brand-verified-green)",
														}}
													>
														done
													</span>
												)}
												{progress === "unlocked" && (
													<span
														className="text-[10px] px-1.5 py-0.5 rounded font-medium"
														style={{
															backgroundColor: "rgba(199, 154, 59, 0.1)",
															color: "var(--brand-seal-gold)",
														}}
													>
														in progress
													</span>
												)}
											</div>
											{mod.unlock_rule === "date" && mod.unlock_date && (
												<p className="text-xs mt-1" style={{ color: "var(--brand-ink-60)" }}>
													Unlocks {new Date(mod.unlock_date).toLocaleDateString()}
												</p>
											)}
										</div>
									</div>
								</div>

								{quiz && (
									<div
										className="border-t px-5 py-3"
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
							</div>
						);
					})}
				</div>
			</main>
		</div>
	);
}
