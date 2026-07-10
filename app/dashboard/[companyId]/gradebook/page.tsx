import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";
import {
	BookOpen,
	BarChart3,
	Users,
	HelpCircle,
	ChevronRight,
	CheckCircle2,
	XCircle,
	AlertCircle,
} from "lucide-react";

export default async function GradebookPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	await whopsdk.verifyUserToken(await headers());

	const courses = await query(
		"SELECT id, title FROM courses WHERE whop_company_id = $1 ORDER BY title",
		[companyId],
	);

	if (courses.rows.length === 0) {
		return (
			<div className="flex flex-col p-8 gap-8 max-w-5xl" style={{ animation: "fadeInUp 0.35s ease" }}>
				<div>
					<h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
						Gradebook
					</h1>
					<p className="text-sm mt-0.5" style={{ color: "var(--brand-ink-60)" }}>
						Student performance across all quizzes
					</p>
				</div>
				<div className="rounded-xl p-12 border text-center" style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}>
					<div className="mb-4 flex justify-center">
						<div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-chalk)" }}>
							<BarChart3 size={24} style={{ color: "var(--brand-ink-30)" }} />
						</div>
					</div>
					<p className="text-base font-semibold" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
						No courses yet
					</p>
					<p className="text-sm mt-1" style={{ color: "var(--brand-ink-60)" }}>
						Create a course with quizzes to see gradebook data.
					</p>
					<Link
						href={`/dashboard/${companyId}/courses/new`}
						className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						Create Course
					</Link>
				</div>
			</div>
		);
	}

	const courseStats = await Promise.all(
		courses.rows.map(async (course: { id: string; title: string }) => {
			const quizzes = await query(
				`SELECT q.id, q.title, q.pass_threshold_pct, m.title AS module_title
				 FROM quizzes q JOIN modules m ON q.module_id = m.id
				 WHERE m.course_id = $1 ORDER BY m.order_index`,
				[course.id],
			);

			const quizIds = quizzes.rows.map((q: { id: string }) => q.id);

			const studentCount = await query(
				`SELECT COUNT(DISTINCT whop_user_id) AS count FROM student_progress WHERE course_id = $1`,
				[course.id],
			);

			const quizStats = quizIds.length > 0
				? await Promise.all(
						quizzes.rows.map(async (quiz: { id: string; title: string; pass_threshold_pct: string; module_title: string }) => {
							const attemptStats = await query(
								`SELECT
									COUNT(*) AS total_attempts,
									COUNT(DISTINCT whop_user_id) AS unique_students,
									COALESCE(AVG(score_pct), 0) AS avg_score,
									COUNT(*) FILTER (WHERE passed) AS passed_count
								 FROM attempts WHERE quiz_id = $1 AND submitted_at IS NOT NULL`,
								[quiz.id],
							);
							return { ...quiz, ...attemptStats.rows[0] };
						}),
					)
				: [];

			return { ...course, studentCount: Number(studentCount.rows[0].count), quizzes: quizStats };
		}),
	);

	const totalStudents = courseStats.reduce((s: number, c: { studentCount: number }) => s + c.studentCount, 0);
	const totalQuizzes = courseStats.reduce(
		(s: number, c: { quizzes: unknown[] }) => s + c.quizzes.length, 0,
	);

	return (
		<div className="flex flex-col p-8 gap-8 max-w-5xl" style={{ animation: "fadeInUp 0.35s ease" }}>
			<div>
				<h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
					Gradebook
				</h1>
				<p className="text-sm mt-0.5" style={{ color: "var(--brand-ink-60)" }}>
					Student performance across all quizzes
				</p>
			</div>

			{courseStats.length === 1 && (
				<div className="grid grid-cols-3 gap-4">
					{[
						{ label: "Courses", value: String(courses.rows.length), icon: BookOpen, color: "var(--brand-seal-gold)" },
						{ label: "Students", value: String(totalStudents), icon: Users, color: "var(--brand-seal-gold)" },
						{ label: "Quizzes", value: String(totalQuizzes), icon: HelpCircle, color: "var(--brand-seal-gold)" },
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
			)}

			<div className="space-y-6">
				{courseStats.map((course: { id: string; title: string; studentCount: number; quizzes: { id: string; title: string; pass_threshold_pct: string; module_title: string; total_attempts: string; unique_students: string; avg_score: string; passed_count: string }[] }, ci: number) => (
					<section key={course.id}>
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
								{course.title}
							</h2>
							<span className="text-xs font-medium" style={{ color: "var(--brand-ink-60)" }}>
								{course.studentCount} student{course.studentCount !== 1 ? "s" : ""}
							</span>
						</div>

						{course.quizzes.length === 0 ? (
							<div className="rounded-xl p-8 border text-center" style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}>
								<AlertCircle size={20} className="mx-auto mb-2" style={{ color: "var(--brand-ink-30)" }} />
								<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
									No quizzes in this course yet.
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{course.quizzes.map((quiz, qi) => {
									const total = Number(quiz.total_attempts);
									const passed = Number(quiz.passed_count);
									const avg = Number(quiz.avg_score);
									const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

									return (
										<Link
											key={quiz.id}
											href={`/dashboard/${companyId}/gradebook/quiz/${quiz.id}`}
											className="block rounded-xl border card-hover"
											style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)", animation: `fadeInUp 0.35s ease ${0.1 + (ci + qi) * 0.04}s both` }}
										>
											<div className="p-4 flex items-center gap-4">
												<div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-chalk)" }}>
													<HelpCircle size={16} style={{ color: "var(--brand-seal-gold)" }} />
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<span className="text-sm font-semibold truncate" style={{ color: "var(--brand-ink)" }}>
															{quiz.title}
														</span>
														<span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "var(--brand-chalk)", color: "var(--brand-ink-60)" }}>
															{quiz.module_title}
														</span>
													</div>
													<div className="flex items-center gap-4 mt-1.5">
														<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
															{total} attempt{total !== 1 ? "s" : ""}
														</span>
														<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
															Pass rate {passRate}%
														</span>
														<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
															Avg {Math.round(avg)}%
														</span>
														<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
															Threshold {Number(quiz.pass_threshold_pct)}%
														</span>
													</div>
												</div>
												<ChevronRight size={16} style={{ color: "var(--brand-ink-30)", flexShrink: 0 }} />
											</div>
										</Link>
									);
								})}
							</div>
						)}
					</section>
				))}
			</div>
		</div>
	);
}
