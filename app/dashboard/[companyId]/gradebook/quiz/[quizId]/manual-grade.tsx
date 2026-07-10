"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export function ManualGradeToggle({
	attemptId,
	questionId,
	answer,
	correct,
}: {
	attemptId: string;
	questionId: string;
	answer: string;
	correct: boolean;
}) {
	const [status, setStatus] = useState(correct);
	const [saving, setSaving] = useState(false);

	const toggle = async () => {
		setSaving(true);
		try {
			const res = await fetch("/api/gradebook/manual-grade", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ attemptId, questionId, correct: !status }),
			});
			if (res.ok) setStatus(!status);
		} finally {
			setSaving(false);
		}
	};

	return (
		<button
			onClick={toggle}
			disabled={saving}
			className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-all"
			style={{
				backgroundColor: status ? "rgba(47,158,104,0.1)" : "rgba(193,70,62,0.1)",
				color: status ? "var(--brand-verified-green)" : "var(--brand-brick)",
				opacity: saving ? 0.6 : 1,
			}}
		>
			{status ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
			{status ? "Correct" : "Wrong"}
			{saving && <RotateCcw size={10} className="animate-spin" />}
		</button>
	);
}
