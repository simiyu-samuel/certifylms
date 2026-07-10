import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());

	const [experience, user, access] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(experienceId, { id: userId }),
	]);

	const displayName = user.name || `@${user.username}`;

	if (!access) {
		return (
			<div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
				<p style={{ color: "var(--brand-brick)" }}>You don't have access to this course.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col p-6 gap-6">
			<div className="flex items-center gap-3">
				<div
					className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					C
				</div>
				<div>
					<h1
						className="text-xl font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						{experience.name || "My Course"}
					</h1>
					<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
						Welcome back, {displayName}
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
				<h2 className="text-lg font-semibold mb-3" style={{ color: "var(--brand-ink)" }}>
					Your Progress
				</h2>
				<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
					Modules, quizzes, and your certificate will appear here once the course is set up.
				</p>
			</div>
		</div>
	);
}
