"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";

export default function NewCoursePage() {
	const { companyId } = useParams<{ companyId: string }>();
	const router = useRouter();
	const { toast } = useToast();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [saving, setSaving] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		setSaving(true);

		const res = await fetch("/api/courses", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				companyId,
				title: title.trim(),
				description: description.trim() || null,
			}),
		});

		if (res.ok) {
			toast("Course created successfully", "success");
			router.push(`/dashboard/${companyId}/courses`);
		} else {
			const data = await res.json();
			toast(data.error || "Failed to create course", "error");
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
					New Course
				</h1>
				<p className="text-sm mt-1" style={{ color: "var(--brand-ink-60)" }}>
					Create a new course to organize modules and quizzes.
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
					<label
						className="text-sm font-semibold"
						style={{ color: "var(--brand-ink)" }}
					>
						Course Title
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
							boxShadow: "none",
						}}
						placeholder="e.g. Crypto Trading Fundamentals"
						required
						autoFocus
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label
						className="text-sm font-semibold"
						style={{ color: "var(--brand-ink)" }}
					>
						Description
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="rounded-lg px-4 py-2.5 border text-sm outline-none focus:ring-2 transition-shadow resize-none"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
						placeholder="Brief description of what this course covers..."
						rows={3}
					/>
				</div>

				<div className="flex gap-3 pt-2">
					<button
						type="submit"
						disabled={saving || !title.trim()}
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						{saving ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<Plus size={16} />
						)}
						{saving ? "Creating..." : "Create Course"}
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
