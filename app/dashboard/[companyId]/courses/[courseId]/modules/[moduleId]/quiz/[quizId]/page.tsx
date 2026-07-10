"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Quiz = {
	id: string;
	title: string;
	pass_threshold_pct: number;
	max_attempts: number | null;
	time_limit_seconds: number | null;
	randomize_order: boolean;
};

export default function QuizDetailPage() {
	const { companyId, courseId, moduleId, quizId } = useParams<{
		companyId: string;
		courseId: string;
		moduleId: string;
		quizId: string;
	}>();
	const router = useRouter();
	const [quiz, setQuiz] = useState<Quiz | null>(null);
	const [editing, setEditing] = useState(false);
	const [title, setTitle] = useState("");
	const [passThreshold, setPassThreshold] = useState("80");
	const [maxAttempts, setMaxAttempts] = useState("");
	const [randomize, setRandomize] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetch(`/api/quizzes/${quizId}`)
			.then((r) => r.json())
			.then((data) => {
				setQuiz(data);
				setTitle(data.title || "");
				setPassThreshold(String(data.pass_threshold_pct ?? 80));
				setMaxAttempts(data.max_attempts ? String(data.max_attempts) : "");
				setRandomize(data.randomize_order ?? false);
			});
	}, [quizId]);

	async function handleSave() {
		if (!title.trim()) return;
		setSaving(true);
		const res = await fetch(`/api/quizzes/${quizId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: title.trim(),
				pass_threshold_pct: Number(passThreshold),
				max_attempts: maxAttempts ? Number(maxAttempts) : null,
				randomize_order: randomize,
			}),
		});
		if (res.ok) {
			const updated = await res.json();
			setQuiz(updated);
			setEditing(false);
		} else {
			alert("Failed to update quiz");
		}
		setSaving(false);
	}

	if (!quiz) return <div className="p-6" />;

	return (
		<div className="flex flex-col p-6 gap-6 max-w-2xl">
			<div className="flex items-center justify-between">
				<div>
					<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
						Quiz
					</span>
					<h1
						className="text-2xl font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						{quiz.title}
					</h1>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setEditing(!editing)}
						className="px-3 py-1.5 rounded-lg text-xs font-medium border"
						style={{ borderColor: "var(--brand-ink-30)", color: "var(--brand-ink-60)" }}
					>
						{editing ? "Cancel" : "Settings"}
					</button>
					<button
						type="button"
						onClick={() =>
							router.push(
								`/dashboard/${companyId}/courses/${courseId}/modules/${moduleId}/quiz/${quizId}/builder`,
							)
						}
						className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						Edit Questions
					</button>
				</div>
			</div>

			{editing ? (
				<div
					className="rounded-xl p-6 border flex flex-col gap-4"
					style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
				>
					<h2 className="text-lg font-semibold" style={{ color: "var(--brand-ink)" }}>
						Quiz Settings
					</h2>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
							Title
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
							className="rounded-lg px-3 py-2 border text-sm max-w-[120px]"
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
							className="rounded-lg px-3 py-2 border text-sm max-w-[120px]"
							style={{
								borderColor: "var(--brand-ink-30)",
								backgroundColor: "white",
								color: "var(--brand-ink)",
							}}
							placeholder="Unlimited"
						/>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="randomize"
							checked={randomize}
							onChange={(e) => setRandomize(e.target.checked)}
						/>
						<label htmlFor="randomize" className="text-sm" style={{ color: "var(--brand-ink)" }}>
							Randomize question order per attempt
						</label>
					</div>

					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="px-4 py-2 rounded-lg text-sm font-medium text-white self-start disabled:opacity-50"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						{saving ? "Saving..." : "Save Settings"}
					</button>
				</div>
			) : (
				<div
					className="rounded-xl p-6 border"
					style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
				>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span style={{ color: "var(--brand-ink-60)" }}>Pass Threshold</span>
							<p className="font-semibold mt-0.5" style={{ color: "var(--brand-ink)" }}>
								{quiz.pass_threshold_pct}%
							</p>
						</div>
						<div>
							<span style={{ color: "var(--brand-ink-60)" }}>Max Attempts</span>
							<p className="font-semibold mt-0.5" style={{ color: "var(--brand-ink)" }}>
								{quiz.max_attempts ?? "Unlimited"}
							</p>
						</div>
						<div>
							<span style={{ color: "var(--brand-ink-60)" }}>Randomized Order</span>
							<p className="font-semibold mt-0.5" style={{ color: "var(--brand-ink)" }}>
								{quiz.randomize_order ? "Yes" : "No"}
							</p>
						</div>
						<div>
							<span style={{ color: "var(--brand-ink-60)" }}>Time Limit</span>
							<p className="font-semibold mt-0.5" style={{ color: "var(--brand-ink)" }}>
								{quiz.time_limit_seconds ? `${quiz.time_limit_seconds}s` : "None"}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
