"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function NewQuizPage() {
	const { companyId, courseId, moduleId } = useParams<{
		companyId: string;
		courseId: string;
		moduleId: string;
	}>();
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [passThreshold, setPassThreshold] = useState("80");
	const [maxAttempts, setMaxAttempts] = useState("");
	const [saving, setSaving] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		setSaving(true);

		const res = await fetch(`/api/modules/${moduleId}/quiz`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: title.trim(),
				pass_threshold_pct: Number(passThreshold),
				max_attempts: maxAttempts ? Number(maxAttempts) : null,
			}),
		});

		if (res.ok) {
			router.push(`/dashboard/${companyId}/courses/${courseId}`);
		} else {
			const data = await res.json();
			alert(data.error || "Failed to create quiz");
			setSaving(false);
		}
	}

	return (
		<div className="flex flex-col p-6 gap-6 max-w-lg">
			<h1
				className="text-2xl font-semibold"
				style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
			>
				New Quiz
			</h1>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
						Quiz Title
					</label>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="rounded-lg px-3 py-2 border text-sm"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
						placeholder="e.g. Module 1 Quiz"
						required
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
						Pass Threshold (%)
					</label>
					<input
						type="number"
						value={passThreshold}
						onChange={(e) => setPassThreshold(e.target.value)}
						min={0}
						max={100}
						className="rounded-lg px-3 py-2 border text-sm"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
						Max Attempts
					</label>
					<input
						type="number"
						value={maxAttempts}
						onChange={(e) => setMaxAttempts(e.target.value)}
						min={1}
						className="rounded-lg px-3 py-2 border text-sm"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
						placeholder="Leave empty for unlimited"
					/>
					<p className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
						Leave empty for unlimited attempts
					</p>
				</div>

				<div className="flex gap-3 mt-2">
					<button
						type="submit"
						disabled={saving || !title.trim()}
						className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						{saving ? "Creating..." : "Create Quiz"}
					</button>
					<button
						type="button"
						onClick={() => router.back()}
						className="px-4 py-2 rounded-lg text-sm font-medium"
						style={{ color: "var(--brand-ink-60)" }}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
