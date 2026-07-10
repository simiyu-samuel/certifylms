"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditCoursePage() {
	const { companyId, courseId } = useParams<{ companyId: string; courseId: string }>();
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetch(`/api/courses/${courseId}`)
			.then((r) => r.json())
			.then((data) => {
				setTitle(data.title || "");
				setDescription(data.description || "");
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [courseId]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		setSaving(true);

		const res = await fetch(`/api/courses/${courseId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: title.trim(),
				description: description.trim() || null,
			}),
		});

		if (res.ok) {
			router.push(`/dashboard/${companyId}/courses/${courseId}`);
		} else {
			const data = await res.json();
			alert(data.error || "Failed to update course");
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
				Edit Course
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
						Description
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="rounded-lg px-3 py-2 border text-sm"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
						rows={3}
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
