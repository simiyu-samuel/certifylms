import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { DashboardSidebar } from "./sidebar";
import { ToastProvider } from "@/components/toast";

export default async function DashboardLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const user = await whopsdk.users.retrieve(userId);
	const displayName = user.name || `@${user.username}`;

	return (
		<div className="flex min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
			<DashboardSidebar
				companyId={companyId}
				userName={displayName}
			/>
			<main className="flex-1 min-w-0">
				<ToastProvider>
					{children}
				</ToastProvider>
			</main>
		</div>
	);
}
