"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function ModuleCompleteButton({
	courseId,
	moduleId,
	moduleOrderIndex,
}: {
	courseId: string;
	moduleId: string;
	moduleOrderIndex: number;
}) {
	const [done, setDone] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleComplete() {
		setLoading(true);
		try {
			const res = await fetch("/api/experiences/complete-module", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ courseId, moduleId, moduleOrderIndex }),
			});
			if (res.ok) setDone(true);
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}

	if (done) {
		return (
			<span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--brand-verified-green)" }}>
				<CheckCircle2 size={14} />
				Completed
			</span>
		);
	}

	return (
		<button
			onClick={handleComplete}
			disabled={loading}
			className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
			style={{ backgroundColor: "var(--brand-seal-gold)" }}
		>
			{loading ? "Marking..." : "Mark Complete"}
		</button>
	);
}
