import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";
import { notFound } from "next/navigation";

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

	return (
		<div className="flex flex-col p-6 gap-6">
			<div className="flex items-center justify-between">
				<div>
					<Link
						href={`/dashboard/${companyId}/courses`}
						className="text-xs"
						style={{ color: "var(--brand-ink-60)" }}
					>
						&larr; Courses
					</Link>
					<h1
						className="text-2xl font-semibold mt-1"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						{course.rows[0].title}
					</h1>
					{course.rows[0].description && (
						<p className="text-sm mt-1" style={{ color: "var(--brand-ink-60)" }}>
							{course.rows[0].description}
						</p>
					)}
				</div>
				<Link
					href={`/dashboard/${companyId}/courses/${courseId}/edit`}
					className="px-3 py-1.5 rounded-lg text-xs font-medium border"
					style={{ borderColor: "var(--brand-ink-30)", color: "var(--brand-ink-60)" }}
				>
					Edit
				</Link>
			</div>

			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<h2
						className="text-lg font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Modules
					</h2>
					<Link
						href={`/dashboard/${companyId}/courses/${courseId}/modules/new`}
						className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						Add Module
					</Link>
				</div>

				{modules.rows.length === 0 ? (
					<div
						className="rounded-xl p-6 border text-center"
						style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
					>
						<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
							No modules yet. Add your first module to start building your course.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{modules.rows.map((mod) => (
							<div
								key={mod.id}
								className="rounded-xl p-4 border"
								style={{
									backgroundColor: "white",
									borderColor: "var(--brand-ink-30)",
								}}
							>
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<span
											className="text-xs font-mono"
											style={{ color: "var(--brand-ink-30)" }}
										>
											#{mod.order_index}
										</span>
										<span
											className="font-medium"
											style={{ color: "var(--brand-ink)" }}
										>
											{mod.title}
										</span>
									</div>
									<div className="flex gap-2">
										{mod.whop_lesson_id && (
											<span
												className="text-xs px-2 py-0.5 rounded"
												style={{
													backgroundColor: "var(--brand-chalk)",
													color: "var(--brand-ink-60)",
												}}
											>
												Lesson
											</span>
										)}
									</div>
								</div>

								<div className="flex items-center gap-2">
									{quizzes.rows
										.filter((q) => q.module_id === mod.id)
										.map((q) => (
											<Link
												key={q.id}
												href={`/dashboard/${companyId}/courses/${courseId}/modules/${mod.id}/quiz/${q.id}`}
												className="text-xs px-2 py-1 rounded"
												style={{
													backgroundColor: "var(--brand-chalk)",
													color: "var(--brand-seal-gold)",
												}}
											>
												Quiz: {q.title}
											</Link>
										))}

									{!quizzes.rows.some((q) => q.module_id === mod.id) && (
										<Link
											href={`/dashboard/${companyId}/courses/${courseId}/modules/${mod.id}/quiz/new`}
											className="text-xs"
											style={{ color: "var(--brand-seal-gold)" }}
										>
											+ Add Quiz
										</Link>
									)}
								</div>

								<div className="flex gap-2 mt-2">
									<Link
										href={`/dashboard/${companyId}/courses/${courseId}/modules/${mod.id}/edit`}
										className="text-xs"
										style={{ color: "var(--brand-ink-60)" }}
									>
										Edit
									</Link>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
