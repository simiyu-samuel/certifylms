import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());

	const [company, user] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
	]);

	const displayName = user.name || `@${user.username}`;

	const courses = await query(
		"SELECT id, title, created_at FROM courses WHERE whop_company_id = $1 ORDER BY created_at DESC",
		[companyId],
	);

	const courseCount = courses.rows.length;

	return (
		<div className="flex flex-col p-6 gap-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div
						className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						C
					</div>
					<div>
						<h1
							className="text-2xl font-semibold"
							style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
						>
							CertifyLMS
						</h1>
						<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
							{company.title || companyId}
						</p>
					</div>
				</div>
				<Link
					href={`/dashboard/${companyId}/courses/new`}
					className="px-4 py-2 rounded-lg text-sm font-medium text-white"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					New Course
				</Link>
			</div>

			<div className="grid md:grid-cols-3 gap-4">
				{[
					{ label: "Courses", value: String(courseCount) },
					{ label: "Students", value: "0" },
					{ label: "Avg. Score", value: "—" },
				].map((stat) => (
					<div
						key={stat.label}
						className="rounded-xl p-4 border text-center"
						style={{
							backgroundColor: "white",
							borderColor: "var(--brand-ink-30)",
						}}
					>
						<p
							className="text-2xl font-bold"
							style={{
								fontFamily: "var(--font-ibm-plex-mono)",
								color: "var(--brand-seal-gold)",
							}}
						>
							{stat.value}
						</p>
						<p className="text-xs mt-1" style={{ color: "var(--brand-ink-60)" }}>
							{stat.label}
						</p>
					</div>
				))}
			</div>

			<div className="flex gap-4 border-b pb-2" style={{ borderColor: "var(--brand-ink-30)" }}>
				<span
					className="text-sm font-semibold pb-2 border-b-2"
					style={{ color: "var(--brand-seal-gold)", borderColor: "var(--brand-seal-gold)" }}
				>
					Courses
				</span>
				<Link
					href={`/dashboard/${companyId}/courses`}
					className="text-sm pb-2"
					style={{ color: "var(--brand-ink-60)" }}
				>
					All Courses
				</Link>
			</div>

			{courses.rows.length === 0 ? (
				<div
					className="rounded-xl p-8 border text-center"
					style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
				>
					<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
						No courses yet. Create your first course to get started.
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{courses.rows.map((course) => (
						<Link
							key={course.id}
							href={`/dashboard/${companyId}/courses/${course.id}`}
							className="rounded-xl p-4 border flex items-center justify-between"
							style={{
								backgroundColor: "white",
								borderColor: "var(--brand-ink-30)",
							}}
						>
							<span className="font-medium" style={{ color: "var(--brand-ink)" }}>
								{course.title}
							</span>
							<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
								{new Date(course.created_at).toLocaleDateString()}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
