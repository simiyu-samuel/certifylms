"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import {
	ArrowLeft,
	Settings,
	FileQuestion,
	Save,
	Loader2,
	HelpCircle,
	Shuffle,
	Infinity,
	Gavel,
} from "lucide-react";

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
	const { toast } = useToast();
	const [quiz, setQuiz] = useState<Quiz | null>(null);
	const [questionCount, setQuestionCount] = useState(0);
	const [editing, setEditing] = useState(false);
	const [title, setTitle] = useState("");
	const [passThreshold, setPassThreshold] = useState("80");
	const [maxAttempts, setMaxAttempts] = useState("");
	const [randomize, setRandomize] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		Promise.all([
			fetch(`/api/quizzes/${quizId}`).then((r) => r.json()),
			fetch(`/api/quizzes/${quizId}/questions`).then((r) => r.json()),
		]).then(([quizData, questions]) => {
			setQuiz(quizData);
			setQuestionCount(questions.length);
			setTitle(quizData.title || "");
			setPassThreshold(String(quizData.pass_threshold_pct ?? 80));
			setMaxAttempts(quizData.max_attempts ? String(quizData.max_attempts) : "");
			setRandomize(quizData.randomize_order ?? false);
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
			toast("Quiz settings saved", "success");
		} else {
			const data = await res.json();
			toast(data.error || "Failed to save settings", "error");
		}
		setSaving(false);
	}

	if (!quiz) {
		return (
			<div className="p-8 flex items-center gap-2" style={{ color: "var(--brand-ink-60)" }}>
				<Loader2 size={16} className="animate-spin" />
				<span className="text-sm">Loading...</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col p-8 gap-8 max-w-4xl">
			<div className="flex items-start justify-between">
				<div>
					<button
						type="button"
						onClick={() => router.back()}
						className="inline-flex items-center gap-1 text-sm mb-2"
						style={{ color: "var(--brand-ink-60)" }}
					>
						<ArrowLeft size={14} />
						Back to Course
					</button>
					<h1
						className="text-3xl font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						{quiz.title}
					</h1>
					<p className="text-sm mt-1" style={{ color: "var(--brand-ink-60)" }}>
						{questionCount} question{questionCount !== 1 ? "s" : ""}
					</p>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setEditing(!editing)}
						className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
						style={{ borderColor: "var(--brand-ink-30)", color: "var(--brand-ink-60)" }}
					>
						<Settings size={14} />
						{editing ? "Cancel" : "Settings"}
					</button>
					<button
						type="button"
						onClick={() =>
							router.push(
								`/dashboard/${companyId}/courses/${courseId}/modules/${moduleId}/quiz/${quizId}/builder`,
							)
						}
						className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						<FileQuestion size={14} />
						Edit Questions
					</button>
				</div>
			</div>

			{editing ? (
				<div
					className="rounded-xl p-6 border flex flex-col gap-5"
					style={{
						backgroundColor: "white",
						borderColor: "var(--brand-ink-30)",
					}}
				>
					<h2
						className="text-lg font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Quiz Settings
					</h2>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
							Quiz Title
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="rounded-lg px-4 py-2.5 border text-sm outline-none focus:ring-2 transition-shadow"
							style={{
								borderColor: "var(--brand-ink-30)",
								backgroundColor: "white",
								color: "var(--brand-ink)",
							}}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
								Pass Threshold (%)
							</label>
							<input
								type="number"
								value={passThreshold}
								onChange={(e) => setPassThreshold(e.target.value)}
								min={0}
								max={100}
								className="rounded-lg px-4 py-2.5 border text-sm outline-none focus:ring-2 transition-shadow"
								style={{
									borderColor: "var(--brand-ink-30)",
									backgroundColor: "white",
									color: "var(--brand-ink)",
								}}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
								Max Attempts
							</label>
							<input
								type="number"
								value={maxAttempts}
								onChange={(e) => setMaxAttempts(e.target.value)}
								min={1}
								className="rounded-lg px-4 py-2.5 border text-sm outline-none focus:ring-2 transition-shadow"
								style={{
									borderColor: "var(--brand-ink-30)",
									backgroundColor: "white",
									color: "var(--brand-ink)",
								}}
								placeholder="Unlimited"
							/>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="randomize"
							checked={randomize}
							onChange={(e) => setRandomize(e.target.checked)}
							className="w-4 h-4 rounded"
						/>
						<label htmlFor="randomize" className="text-sm" style={{ color: "var(--brand-ink)" }}>
							Randomize question order per attempt
						</label>
					</div>

					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white self-start transition-opacity hover:opacity-90 disabled:opacity-50"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
						{saving ? "Saving..." : "Save Settings"}
					</button>
				</div>
			) : (
				<div
					className="rounded-xl p-6 border"
					style={{
						backgroundColor: "white",
						borderColor: "var(--brand-ink-30)",
					}}
				>
					<h2
						className="text-lg font-semibold mb-4"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Quiz Summary
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div
							className="p-4 rounded-lg text-center"
							style={{ backgroundColor: "var(--brand-chalk)" }}
						>
							<FileQuestion
								size={20}
								className="mx-auto mb-2"
								style={{ color: "var(--brand-seal-gold)" }}
							/>
							<p className="text-2xl font-bold" style={{ fontFamily: "var(--font-ibm-plex-mono)", color: "var(--brand-ink)" }}>
								{questionCount}
							</p>
							<p className="text-xs mt-0.5" style={{ color: "var(--brand-ink-60)" }}>
								Questions
							</p>
						</div>
						<div
							className="p-4 rounded-lg text-center"
							style={{ backgroundColor: "var(--brand-chalk)" }}
						>
							<Gavel
								size={20}
								className="mx-auto mb-2"
								style={{ color: "var(--brand-verified-green)" }}
							/>
							<p className="text-2xl font-bold" style={{ fontFamily: "var(--font-ibm-plex-mono)", color: "var(--brand-ink)" }}>
								{quiz.pass_threshold_pct}%
							</p>
							<p className="text-xs mt-0.5" style={{ color: "var(--brand-ink-60)" }}>
								Pass Threshold
							</p>
						</div>
						<div
							className="p-4 rounded-lg text-center"
							style={{ backgroundColor: "var(--brand-chalk)" }}
						>
							{quiz.max_attempts ? (
								<>
									<p className="text-2xl font-bold" style={{ fontFamily: "var(--font-ibm-plex-mono)", color: "var(--brand-ink)" }}>
										{quiz.max_attempts}
									</p>
								</>
							) : (
								<Infinity
									size={24}
									className="mx-auto mb-2"
									style={{ color: "var(--brand-ink-60)" }}
								/>
							)}
							<p className="text-xs mt-0.5" style={{ color: "var(--brand-ink-60)" }}>
								Max Attempts
							</p>
						</div>
						<div
							className="p-4 rounded-lg text-center"
							style={{ backgroundColor: "var(--brand-chalk)" }}
						>
							<Shuffle
								size={20}
								className="mx-auto mb-2"
								style={{ color: quiz.randomize_order ? "var(--brand-seal-gold)" : "var(--brand-ink-30)" }}
							/>
							<p className="text-xs mt-0.5" style={{ color: "var(--brand-ink-60)" }}>
								{quiz.randomize_order ? "Randomized" : "Fixed order"}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
