"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditModulePage() {
	const { companyId, courseId, moduleId } = useParams<{
		companyId: string;
		courseId: string;
		moduleId: string;
	}>();
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [whopLessonId, setWhopLessonId] = useState("");
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
				}
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [courseId, moduleId]);

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
			}),
		});

		if (res.ok) {
			router.push(`/dashboard/${companyId}/courses/${courseId}`);
		} else {
			const data = await res.json();
			alert(data.error || "Failed to update module");
			setSaving(false);
		}
	}

	if (loading) return <div className="p-6" />;

	return (
		<div className="flex flex-col p-6 gap-6 max-w-lg">
			<h1
				className="text-2xl font-semibold"
				style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
			>
				Edit Module
			</h1>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
						required
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
						Whop Lesson ID
					</label>
					<input
						type="text"
						value={whopLessonId}
						onChange={(e) => setWhopLessonId(e.target.value)}
						className="rounded-lg px-3 py-2 border text-sm"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
						placeholder="Optional — paste the lesson ID from Whop Courses"
					/>
				</div>

				<div className="flex gap-3 mt-2">
					<button
						type="submit"
						disabled={saving || !title.trim()}
						className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						{saving ? "Saving..." : "Save Changes"}
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
