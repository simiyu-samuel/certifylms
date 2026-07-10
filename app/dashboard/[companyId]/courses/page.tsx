import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";
import { BookOpen, Plus, ChevronRight } from "lucide-react";

export default async function CoursesPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	await whopsdk.verifyUserToken(await headers());

	const courses = await query(
		"SELECT id, title, description, created_at FROM courses WHERE whop_company_id = $1 ORDER BY created_at DESC",
		[companyId],
	);

	const moduleCounts = await query(
		"SELECT course_id, COUNT(*) AS count FROM modules GROUP BY course_id",
		[],
	);

	const quizCounts = await query(
		"SELECT m.course_id, COUNT(*) AS count FROM quizzes q JOIN modules m ON q.module_id = m.id GROUP BY m.course_id",
		[],
	);

	const moduleMap = Object.fromEntries(
		moduleCounts.rows.map((r: { course_id: string; count: string }) => [r.course_id, r.count]),
	);
	const quizMap = Object.fromEntries(
		quizCounts.rows.map((r: { course_id: string; count: string }) => [r.course_id, r.count]),
	);

	return (
		<div className="flex flex-col p-8 gap-8 max-w-5xl">
			<div className="flex items-center justify-between">
				<div>
					<h1
						className="text-3xl font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Courses
					</h1>
					<p className="text-sm mt-1" style={{ color: "var(--brand-ink-60)" }}>
						{courses.rows.length} course{courses.rows.length !== 1 ? "s" : ""} total
					</p>
				</div>
				<Link
					href={`/dashboard/${companyId}/courses/new`}
					className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					<Plus size={16} />
					New Course
				</Link>
			</div>

			{courses.rows.length === 0 ? (
				<div
					className="rounded-xl p-12 border text-center"
					style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
				>
					<BookOpen
						size={48}
						className="mx-auto mb-4"
						style={{ color: "var(--brand-ink-30)" }}
					/>
					<p className="text-base font-medium" style={{ color: "var(--brand-ink)" }}>
						No courses yet
					</p>
					<p className="text-sm mt-1 mb-5" style={{ color: "var(--brand-ink-60)" }}>
						Create your first course to get started with quizzes and certificates.
					</p>
					<Link
						href={`/dashboard/${companyId}/courses/new`}
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						<Plus size={16} />
						Create Course
					</Link>
				</div>
			) : (
				<div className="grid md:grid-cols-2 gap-4">
					{courses.rows.map((course) => {
						const modules = Number(moduleMap[course.id] || 0);
						const quizzes = Number(quizMap[course.id] || 0);
						return (
							<Link
								key={course.id}
								href={`/dashboard/${companyId}/courses/${course.id}`}
								className="rounded-xl p-5 border hover:shadow-sm transition-shadow flex items-start justify-between group"
								style={{
									backgroundColor: "white",
									borderColor: "var(--brand-ink-30)",
								}}
							>
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<div
											className="w-2 h-2 rounded-full"
											style={{ backgroundColor: "var(--brand-seal-gold)" }}
										/>
										<h3
											className="font-semibold"
											style={{ color: "var(--brand-ink)" }}
										>
											{course.title}
										</h3>
									</div>
									{course.description && (
										<p
											className="text-sm mt-1 line-clamp-2"
											style={{ color: "var(--brand-ink-60)" }}
										>
											{course.description}
										</p>
									)}
									<div className="flex gap-4 mt-3">
										<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
											{modules} module{modules !== 1 ? "s" : ""}
										</span>
										<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
											{quizzes} quiz{quizzes !== 1 ? "zes" : ""}
										</span>
										<span className="text-xs" style={{ color: "var(--brand-ink-30)" }}>
											{new Date(course.created_at).toLocaleDateString()}
										</span>
									</div>
								</div>
								<ChevronRight
									size={18}
									className="mt-1 transition-opacity opacity-0 group-hover:opacity-100"
									style={{ color: "var(--brand-ink-30)" }}
								/>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
