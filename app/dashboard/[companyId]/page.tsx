import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

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

	return (
		<div className="flex flex-col p-8 gap-6">
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

			<div
				className="rounded-xl p-6 border"
				style={{
					backgroundColor: "white",
					borderColor: "var(--brand-ink-30)",
				}}
			>
				<h2 className="text-lg font-semibold mb-2" style={{ color: "var(--brand-ink)" }}>
					Welcome, {displayName}
				</h2>
				<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
					This is your CertifyLMS dashboard. Courses, quizzes, gradebook, and certificate
					management will appear here.
				</p>
			</div>

			<div className="grid md:grid-cols-3 gap-4">
				{[
					{ label: "Courses", value: "0" },
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
		</div>
	);
}
