import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";

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

	return (
		<div className="flex flex-col p-6 gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1
						className="text-2xl font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Courses
					</h1>
					<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
						{courses.rows.length} course{courses.rows.length !== 1 ? "s" : ""}
					</p>
				</div>
				<Link
					href={`/dashboard/${companyId}/courses/new`}
					className="px-4 py-2 rounded-lg text-sm font-medium text-white"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					New Course
				</Link>
			</div>

			{courses.rows.length === 0 ? (
				<div
					className="rounded-xl p-8 border text-center"
					style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
				>
					<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
						No courses yet.
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
							<div>
								<span className="font-medium" style={{ color: "var(--brand-ink)" }}>
									{course.title}
								</span>
								{course.description && (
									<p
										className="text-xs mt-0.5"
										style={{ color: "var(--brand-ink-60)" }}
									>
										{course.description}
									</p>
								)}
							</div>
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
