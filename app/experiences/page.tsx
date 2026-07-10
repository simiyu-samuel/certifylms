import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { whopsdk } from "@/lib/whop-sdk";
import {
	BookOpen,
	ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExperiencesPage({
	searchParams,
}: {
	searchParams: Promise<{ company?: string }>;
}) {
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const user = await whopsdk.users.retrieve(userId);
	const displayName = user.name || `@${user.username}`;
	const { company: companyParam } = await searchParams;

	let experiences: { id: string; name: string; image: { url: string | null } | null; company: { id: string; title: string } }[] = [];

	if (companyParam) {
		for await (const exp of whopsdk.experiences.list({ company_id: companyParam })) {
			experiences.push(exp);
		}
	} else {
		try {
			const membershipsPage = await whopsdk.memberships.list({ user_ids: [userId] });
			const companyIds = [...new Set(membershipsPage.data.map((m: { company: { id: string } }) => m.company.id))];
			for (const companyId of companyIds) {
				for await (const exp of whopsdk.experiences.list({ company_id: companyId })) {
					if (!experiences.find((e) => e.id === exp.id)) {
						experiences.push(exp);
					}
				}
			}
		} catch {
			// memberships API may lack permissions — empty list
		}
	}

	return (
		<div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
			<header
				className="border-b px-6 py-3 flex items-center gap-2"
				style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
			>
				<Image src="/seal-mark-icon-dark.svg" alt="" width={20} height={20} />
				<span className="text-xs font-medium ml-1" style={{ color: "var(--brand-ink-60)" }}>
					CertifyLMS
				</span>
				<div className="flex-1" />
				<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
					{displayName}
				</span>
			</header>

			<main className="flex-1 max-w-3xl mx-auto w-full p-6">
				<h1
					className="text-2xl font-bold mb-6"
					style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
				>
					My Courses
				</h1>

				{experiences.length === 0 && (
					<div className="flex flex-col items-center justify-center py-16 gap-3">
						<BookOpen size={40} style={{ color: "var(--brand-ink-30)" }} />
						<p className="text-sm font-medium" style={{ color: "var(--brand-ink-60)" }}>
							No courses available yet.
						</p>
						<p className="text-xs" style={{ color: "var(--brand-ink-30)" }}>
							Purchase an access pass to get started.
						</p>
					</div>
				)}

				<div className="space-y-3">
					{experiences.map((exp) => (
						<Link
							key={exp.id}
							href={`/experiences/${exp.id}`}
							className="block rounded-xl border overflow-hidden transition-all card-hover"
							style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
						>
							<div className="p-4 flex items-center gap-4">
								<div
									className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
									style={{ backgroundColor: "rgba(199, 154, 59, 0.12)" }}
								>
									{exp.image?.url ? (
										<img src={exp.image.url} alt="" className="w-full h-full object-cover" />
									) : (
										<BookOpen size={22} style={{ color: "var(--brand-seal-gold)" }} />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<h2 className="text-sm font-semibold truncate" style={{ color: "var(--brand-ink)" }}>
										{exp.name}
									</h2>
									<p className="text-xs mt-0.5" style={{ color: "var(--brand-ink-60)" }}>
										{exp.company.title}
									</p>
								</div>
								<ChevronRight size={16} style={{ color: "var(--brand-ink-30)", flexShrink: 0 }} />
							</div>
						</Link>
					))}
				</div>
			</main>
		</div>
	);
}
