"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Award, BarChart3 } from "lucide-react";
import Image from "next/image";

const navItems = [
	{ href: "", label: "Dashboard", icon: Home },
	{ href: "/courses", label: "Courses", icon: BookOpen },
	{ href: "/gradebook", label: "Gradebook", icon: BarChart3 },
	{ href: "/certificates", label: "Certificates", icon: Award },
];

export function DashboardSidebar({
	companyId,
	userName,
}: {
	companyId: string;
	userName: string;
}) {
	const pathname = usePathname();

	const isActive = (href: string) => {
		const base = `/dashboard/${companyId}`;
		if (!href) return pathname === base;
		return pathname.startsWith(base + href);
	};

	return (
		<aside
			className="w-64 flex-shrink-0 flex flex-col border-r min-h-screen"
			style={{
				backgroundColor: "white",
				borderColor: "var(--brand-ink-30)",
			}}
		>
			<div className="p-4 border-b" style={{ borderColor: "var(--brand-ink-30)" }}>
				<Link href={`/dashboard/${companyId}`} className="block">
					<Image
						src="/wordmark-light-bg.svg"
						alt="CertifyLMS"
						width={160}
						height={46}
						priority
						style={{ display: "block" }}
					/>
				</Link>
			</div>

			<nav className="flex-1 p-3 space-y-1">
				{navItems.map((item) => {
					const Icon = item.icon;
					const active = isActive(item.href);
					return (
						<Link
							key={item.href}
							href={`/dashboard/${companyId}${item.href}`}
							className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium nav-hover sidebar-link"
							style={{
								backgroundColor: active ? "var(--brand-chalk)" : "transparent",
								color: active ? "var(--brand-seal-gold)" : "var(--brand-ink-60)",
							}}
						>
							<Icon size={18} />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div
				className="p-4 border-t text-xs"
				style={{ borderColor: "var(--brand-ink-30)", color: "var(--brand-ink-60)" }}
			>
				{userName}
			</div>
		</aside>
	);
}
