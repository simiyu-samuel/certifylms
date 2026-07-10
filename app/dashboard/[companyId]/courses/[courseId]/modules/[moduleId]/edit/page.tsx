"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function EditModulePage() {
	const { companyId, courseId, moduleId } = useParams<{
		companyId: string;
		courseId: string;
		moduleId: string;
	}>();
	const router = useRouter();
	const { toast } = useToast();
	const [title, setTitle] = useState("");
	const [whopLessonId, setWhopLessonId] = useState("");
	const [unlockRule, setUnlockRule] = useState("always");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetch(`/api/courses/${courseId}/modules`)
			.then((r) => r.json())
			.then((data) => {
				const mod = data.find((m: { id: string }) => m.id === moduleId);
				if (mod) {
					setTitle(mod.title || "");
					setWhopLessonId(mod.whop_lesson_id || "");
					setUnlockRule(mod.unlock_rule || "always");
				}
				setLoading(false);
			})
			.catch(() => {
				toast("Failed to load module", "error");
				setLoading(false);
			});
	}, [courseId, moduleId, toast]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		setSaving(true);

		const res = await fetch(`/api/modules/${moduleId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: title.trim(),
				whop_lesson_id: whopLessonId.trim() || null,
				unlock_rule: unlockRule,
			}),
		});

		if (res.ok) {
			toast("Module updated", "success");
			router.push(`/dashboard/${companyId}/courses/${courseId}`);
		} else {
			const data = await res.json();
			toast(data.error || "Failed to update module", "error");
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="p-8 flex items-center gap-2" style={{ color: "var(--brand-ink-60)" }}>
				<Loader2 size={16} className="animate-spin" />
				<span className="text-sm">Loading...</span>
			</div>
		);
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
					Edit Module
				</h1>
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
						Module Title
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
						required
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
						Whop Lesson ID
					</label>
					<input
						type="text"
						value={whopLessonId}
						onChange={(e) => setWhopLessonId(e.target.value)}
						className="rounded-lg px-4 py-2.5 border text-sm outline-none focus:ring-2 transition-shadow"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
						placeholder="Optional — paste the lesson ID from Whop Courses"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
						Unlock Rule
					</label>
					<select
						value={unlockRule}
						onChange={(e) => setUnlockRule(e.target.value)}
						className="rounded-lg px-4 py-2.5 border text-sm outline-none focus:ring-2 transition-shadow"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
					>
						<option value="always">Always open</option>
						<option value="previous_quiz_passed">Requires previous quiz pass</option>
						<option value="date">Unlock on date</option>
					</select>
				</div>

				<div className="flex gap-3 pt-2">
					<button
						type="submit"
						disabled={saving || !title.trim()}
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
						{saving ? "Saving..." : "Save Changes"}
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
