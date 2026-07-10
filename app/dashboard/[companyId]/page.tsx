import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";
import { BookOpen, Award, TrendingUp, Users } from "lucide-react";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const user = await whopsdk.users.retrieve(userId);

	const courses = await query(
		"SELECT id, title, created_at FROM courses WHERE whop_company_id = $1 ORDER BY created_at DESC",
		[companyId],
	);

	const moduleCount = await query(
		"SELECT COUNT(*) FROM modules m JOIN courses c ON m.course_id = c.id WHERE c.whop_company_id = $1",
		[companyId],
	);

	const quizCount = await query(
		"SELECT COUNT(*) FROM quizzes q JOIN modules m ON q.module_id = m.id JOIN courses c ON m.course_id = c.id WHERE c.whop_company_id = $1",
		[companyId],
	);

	const stats = [
		{
			label: "Courses",
			value: String(courses.rows.length),
			icon: BookOpen,
			color: "var(--brand-seal-gold)",
		},
		{
			label: "Modules",
			value: String(moduleCount.rows[0].count),
			icon: TrendingUp,
			color: "var(--brand-seal-gold)",
		},
		{
			label: "Quizzes",
			value: String(quizCount.rows[0].count),
			icon: Award,
			color: "var(--brand-seal-gold)",
		},
		{
			label: "Students",
			value: "0",
			icon: Users,
			color: "var(--brand-ink-60)",
		},
	];

	return (
		<div className="flex flex-col p-8 gap-8 max-w-5xl" style={{ animation: "fadeInUp 0.35s ease" }}>
			<div className="flex items-center justify-between">
				<div>
					<h1
						className="text-3xl font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Dashboard
					</h1>
					<p className="text-sm mt-0.5" style={{ color: "var(--brand-ink-60)" }}>
						Overview of your learning programs
					</p>
				</div>
				<Link
					href={`/dashboard/${companyId}/courses/new`}
					className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					<BookOpen size={16} />
					New Course
				</Link>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{stats.map((stat, i) => {
					const Icon = stat.icon;
					return (
						<div
							key={stat.label}
							className="rounded-xl p-5 border flex flex-col gap-2 card-hover"
							style={{
								backgroundColor: "white",
								borderColor: "var(--brand-ink-30)",
								animation: `fadeInUp 0.35s ease ${i * 0.06}s both`,
							}}
						>
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium" style={{ color: "var(--brand-ink-60)" }}>
									{stat.label}
								</span>
								<Icon size={18} style={{ color: stat.color }} />
							</div>
							<span
								className="text-3xl font-bold"
								style={{
									fontFamily: "var(--font-ibm-plex-mono)",
									color: "var(--brand-ink)",
								}}
							>
								{stat.value}
							</span>
						</div>
					);
				})}
			</div>

			<section>
				<div className="flex items-center justify-between mb-4">
					<h2
						className="text-lg font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Recent Courses
					</h2>
					<Link
						href={`/dashboard/${companyId}/courses`}
						className="text-sm font-medium transition-colors hover:underline"
						style={{ color: "var(--brand-seal-gold)" }}
					>
						View all
					</Link>
				</div>

				{courses.rows.length === 0 ? (
					<div
						className="rounded-xl p-12 border text-center"
						style={{
							backgroundColor: "white",
							borderColor: "var(--brand-ink-30)",
							animation: "fadeInUp 0.35s ease 0.15s both",
						}}
					>
						<div className="mb-4 flex justify-center">
							<div
								className="w-12 h-12 rounded-xl flex items-center justify-center"
								style={{ backgroundColor: "var(--brand-chalk)" }}
							>
								<BookOpen size={24} style={{ color: "var(--brand-ink-30)" }} />
							</div>
						</div>
						<p className="text-base font-semibold" style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}>
							No courses yet
						</p>
						<p className="text-sm mt-1" style={{ color: "var(--brand-ink-60)" }}>
							Create your first course to start building quizzes and certificates.
						</p>
						<Link
							href={`/dashboard/${companyId}/courses/new`}
							className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
							style={{ backgroundColor: "var(--brand-seal-gold)" }}
						>
							Create Course
						</Link>
					</div>
				) : (
					<div className="grid md:grid-cols-2 gap-4">
						{courses.rows.map((course, i) => (
							<Link
								key={course.id}
								href={`/dashboard/${companyId}/courses/${course.id}`}
								className="rounded-xl p-5 border card-hover"
								style={{
									backgroundColor: "white",
									borderColor: "var(--brand-ink-30)",
									animation: `fadeInUp 0.35s ease ${0.2 + i * 0.06}s both`,
								}}
							>
								<h3
									className="font-semibold mb-1"
									style={{ color: "var(--brand-ink)" }}
								>
									{course.title}
								</h3>
								<p className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
									Created {new Date(course.created_at).toLocaleDateString()}
								</p>
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
