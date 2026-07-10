import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import {
	BookOpen,
	ChevronRight,
	Plus,
	Edit3,
	HelpCircle,
	Lock,
	Calendar,
	CheckCircle2,
	FileQuestion,
} from "lucide-react";

const unlockLabels: Record<string, string> = {
	always: "Always open",
	previous_quiz_passed: "Requires previous quiz pass",
	date: "Opens on date",
};

const unlockIcons: Record<string, typeof Lock> = {
	always: CheckCircle2,
	previous_quiz_passed: Lock,
	date: Calendar,
};

export default async function CourseDetailPage({
	params,
}: {
	params: Promise<{ companyId: string; courseId: string }>;
}) {
	const { companyId, courseId } = await params;
	await whopsdk.verifyUserToken(await headers());

	const course = await query("SELECT * FROM courses WHERE id = $1 AND whop_company_id = $2", [
		courseId,
		companyId,
	]);
	if (!course.rows[0]) notFound();

	const modules = await query(
		"SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index ASC",
		[courseId],
	);

	const quizzes = await query(
		`SELECT q.*, m.title AS module_title, m.order_index AS module_order
     FROM quizzes q JOIN modules m ON q.module_id = m.id
     WHERE m.course_id = $1 ORDER BY m.order_index ASC`,
		[courseId],
	);

	const questionCounts = await query(
		"SELECT quiz_id, COUNT(*) AS count FROM questions GROUP BY quiz_id",
		[],
	);
	const questionMap = Object.fromEntries(
		questionCounts.rows.map((r: { quiz_id: string; count: string }) => [r.quiz_id, r.count]),
	);

	return (
		<div className="flex flex-col p-8 gap-8 max-w-4xl">
			<div className="flex items-start justify-between">
				<div>
					<Link
						href={`/dashboard/${companyId}/courses`}
						className="inline-flex items-center gap-1 text-sm mb-2"
						style={{ color: "var(--brand-ink-60)" }}
					>
						<ChevronRight size={14} className="rotate-180" />
						Back to Courses
					</Link>
					<h1
						className="text-3xl font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						{course.rows[0].title}
					</h1>
					{course.rows[0].description && (
						<p className="text-sm mt-1.5" style={{ color: "var(--brand-ink-60)" }}>
							{course.rows[0].description}
						</p>
					)}
				</div>
				<div className="flex gap-2">
					<Link
						href={`/dashboard/${companyId}/courses/${courseId}/edit`}
						className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
						style={{ borderColor: "var(--brand-ink-30)", color: "var(--brand-ink-60)" }}
					>
						<Edit3 size={14} />
						Edit
					</Link>
					<Link
						href={`/dashboard/${companyId}/courses/${courseId}/modules/new`}
						className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						<Plus size={16} />
						Add Module
					</Link>
				</div>
			</div>

			<div className="flex gap-6 text-sm pb-4 border-b" style={{ borderColor: "var(--brand-ink-30)" }}>
				<div>
					<span style={{ color: "var(--brand-ink-60)" }}>Modules</span>
					<p className="font-semibold mt-0.5" style={{ color: "var(--brand-ink)" }}>
						{modules.rows.length}
					</p>
				</div>
				<div>
					<span style={{ color: "var(--brand-ink-60)" }}>Quizzes</span>
					<p className="font-semibold mt-0.5" style={{ color: "var(--brand-ink)" }}>
						{quizzes.rows.length}
					</p>
				</div>
				<div>
					<span style={{ color: "var(--brand-ink-60)" }}>Questions</span>
					<p className="font-semibold mt-0.5" style={{ color: "var(--brand-ink)" }}>
						{Object.values(questionMap).reduce((a: number, b: string) => a + Number(b), 0)}
					</p>
				</div>
			</div>

			<section>
				<div className="flex items-center justify-between mb-4">
					<h2
						className="text-lg font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Modules &amp; Quizzes
					</h2>
				</div>

				{modules.rows.length === 0 ? (
					<div
						className="rounded-xl p-10 border text-center"
						style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
					>
						<BookOpen size={40} className="mx-auto mb-4" style={{ color: "var(--brand-ink-30)" }} />
						<p className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
							No modules yet
						</p>
						<p className="text-xs mt-1" style={{ color: "var(--brand-ink-60)" }}>
							Add your first module to start building your course structure.
						</p>
						<Link
							href={`/dashboard/${companyId}/courses/${courseId}/modules/new`}
							className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
							style={{ backgroundColor: "var(--brand-seal-gold)" }}
						>
							<Plus size={16} />
							Add Module
						</Link>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{modules.rows.map((mod, idx) => {
							const UnlockIcon = unlockIcons[mod.unlock_rule] || Lock;
							const quiz = quizzes.rows.find((q) => q.module_id === mod.id);
							const qCount = quiz ? Number(questionMap[quiz.id] || 0) : 0;

							return (
								<div
									key={mod.id}
									className="rounded-xl border overflow-hidden"
									style={{
										backgroundColor: "white",
										borderColor: "var(--brand-ink-30)",
									}}
								>
									<div className="p-5">
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<span
														className="text-xs font-mono px-1.5 py-0.5 rounded"
														style={{
															backgroundColor: "var(--brand-chalk)",
															color: "var(--brand-ink-60)",
														}}
													>
														{mod.order_index}
													</span>
													<h3
														className="font-semibold"
														style={{ color: "var(--brand-ink)" }}
													>
														{mod.title}
													</h3>
												</div>
												<div className="flex items-center gap-3 mt-2">
													<span
														className="inline-flex items-center gap-1 text-xs"
														style={{ color: "var(--brand-ink-60)" }}
													>
														<UnlockIcon size={12} />
														{unlockLabels[mod.unlock_rule] || mod.unlock_rule}
													</span>
													{mod.whop_lesson_id && (
														<span
															className="inline-flex items-center gap-1 text-xs"
															style={{ color: "var(--brand-ink-60)" }}
														>
															<BookOpen size={12} />
															Lesson linked
														</span>
													)}
												</div>
											</div>
											<div className="flex items-center gap-1">
												<Link
													href={`/dashboard/${companyId}/courses/${courseId}/modules/${mod.id}/edit`}
													className="p-1 rounded hover:bg-gray-100"
												>
													<Edit3 size={14} style={{ color: "var(--brand-ink-60)" }} />
												</Link>
											</div>
										</div>

										{quiz && (
											<div
												className="mt-4 pt-4 border-t flex items-center justify-between"
												style={{ borderColor: "var(--brand-ink-30)" }}
											>
												<Link
													href={`/dashboard/${companyId}/courses/${courseId}/modules/${mod.id}/quiz/${quiz.id}`}
													className="flex items-center gap-2 group"
												>
													<FileQuestion
														size={16}
														style={{ color: "var(--brand-seal-gold)" }}
													/>
													<div>
														<span
															className="text-sm font-medium group-hover:underline"
															style={{ color: "var(--brand-ink)" }}
														>
															{quiz.title}
														</span>
														<div className="flex gap-3 mt-0.5">
															<span
																className="text-xs"
																style={{ color: "var(--brand-ink-60)" }}
															>
																{qCount} question{qCount !== 1 ? "s" : ""}
															</span>
															<span
																className="text-xs"
																style={{ color: "var(--brand-ink-60)" }}
															>
																Pass: {quiz.pass_threshold_pct}%
															</span>
															{quiz.max_attempts && (
																<span
																	className="text-xs"
																	style={{ color: "var(--brand-ink-60)" }}
																>
																	Max {quiz.max_attempts} attempts
																</span>
															)}
														</div>
													</div>
													<ChevronRight
														size={16}
														className="opacity-0 group-hover:opacity-100 transition-opacity"
														style={{ color: "var(--brand-ink-30)" }}
													/>
												</Link>
												<Link
													href={`/dashboard/${companyId}/courses/${courseId}/modules/${mod.id}/quiz/${quiz.id}/builder`}
													className="text-xs font-medium px-3 py-1.5 rounded-lg border"
													style={{
														borderColor: "var(--brand-seal-gold)",
														color: "var(--brand-seal-gold)",
													}}
												>
													Edit Questions
												</Link>
											</div>
										)}

										{!quiz && (
											<div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--brand-ink-30)" }}>
												<Link
													href={`/dashboard/${companyId}/courses/${courseId}/modules/${mod.id}/quiz/new`}
													className="inline-flex items-center gap-1.5 text-sm font-medium"
													style={{ color: "var(--brand-seal-gold)" }}
												>
													<Plus size={14} />
													Add Quiz
												</Link>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
}
