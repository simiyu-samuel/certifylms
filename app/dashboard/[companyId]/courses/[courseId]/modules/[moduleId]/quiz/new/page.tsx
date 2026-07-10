"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { ArrowLeft, Plus, Loader2, HelpCircle } from "lucide-react";

export default function NewQuizPage() {
	const { companyId, courseId, moduleId } = useParams<{
		companyId: string;
		courseId: string;
		moduleId: string;
	}>();
	const router = useRouter();
	const { toast } = useToast();
	const [title, setTitle] = useState("");
	const [passThreshold, setPassThreshold] = useState("80");
	const [maxAttempts, setMaxAttempts] = useState("");
	const [randomize, setRandomize] = useState(false);
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
				randomize_order: randomize,
			}),
		});

		if (res.ok) {
			toast("Quiz created successfully", "success");
			router.push(`/dashboard/${companyId}/courses/${courseId}`);
		} else {
			const data = await res.json();
			toast(data.error || "Failed to create quiz", "error");
			setSaving(false);
		}
	}

	return (
		<div className="flex flex-col p-8 gap-8 max-w-2xl">
			<div>
				<button
					type="button"
					onClick={() => router.back()}
					className="inline-flex items-center gap-1 text-sm mb-2"
					style={{ color: "var(--brand-ink-60)" }}
				>
					<ArrowLeft size={14} />
					Back
				</button>
				<h1
					className="text-3xl font-semibold"
					style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
				>
					New Quiz
				</h1>
				<p className="text-sm mt-1" style={{ color: "var(--brand-ink-60)" }}>
					Configure the quiz for this module.
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="rounded-xl p-6 border flex flex-col gap-5"
				style={{
					backgroundColor: "white",
					borderColor: "var(--brand-ink-30)",
				}}
			>
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
						placeholder="e.g. Module 1 Quiz"
						required
						autoFocus
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
					<span
						className="text-xs"
						style={{ color: "var(--brand-ink-30)", cursor: "help" }}
						title="Questions appear in a different order each time a student takes the quiz"
					>
						<HelpCircle size={14} />
					</span>
				</div>

				<div className="flex gap-3 pt-2">
					<button
						type="submit"
						disabled={saving || !title.trim()}
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
						{saving ? "Creating..." : "Create Quiz"}
					</button>
					<button
						type="button"
						onClick={() => router.back()}
						className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
						style={{ borderColor: "var(--brand-ink-30)", color: "var(--brand-ink-60)" }}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
