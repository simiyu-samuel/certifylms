"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

type Question = {
	id: string;
	quiz_id: string;
	type: "multiple_choice" | "true_false" | "multi_select" | "short_text";
	prompt: string;
	options: string[] | null;
	correct_answer: string | string[];
	order_index: number;
};

const QUESTION_TYPES = [
	{ value: "multiple_choice", label: "Multiple Choice" },
	{ value: "true_false", label: "True / False" },
	{ value: "multi_select", label: "Multi-Select" },
	{ value: "short_text", label: "Short Text" },
] as const;

export default function QuizBuilderPage() {
	const { companyId, courseId, moduleId, quizId } = useParams<{
		companyId: string;
		courseId: string;
		moduleId: string;
		quizId: string;
	}>();

	const router = useRouter();
	const [questions, setQuestions] = useState<Question[]>([]);
	const [loading, setLoading] = useState(true);

	const [showNew, setShowNew] = useState(false);
	const [newType, setNewType] = useState<string>("multiple_choice");
	const [newPrompt, setNewPrompt] = useState("");
	const [newOptions, setNewOptions] = useState("");
	const [newCorrect, setNewCorrect] = useState("");
	const [saving, setSaving] = useState(false);

	const loadQuestions = useCallback(async () => {
		const res = await fetch(`/api/quizzes/${quizId}/questions`);
		if (res.ok) {
			const data = await res.json();
			setQuestions(data);
		}
		setLoading(false);
	}, [quizId]);

	useEffect(() => {
		loadQuestions();
	}, [loadQuestions]);

	async function handleAddQuestion(e: React.FormEvent) {
		e.preventDefault();
		if (!newPrompt.trim()) return;
		setSaving(true);

		let options: string[] | null = null;
		let correctAnswer: string | string[] = newCorrect.trim();

		if (newType === "multiple_choice" || newType === "multi_select") {
			options = newOptions
				.split("\n")
				.map((s) => s.trim())
				.filter(Boolean);

			if (newType === "multi_select") {
				correctAnswer = newCorrect
					.split("\n")
					.map((s) => s.trim())
					.filter(Boolean);
			}
		}

		if (newType === "true_false") {
			options = ["True", "False"];
		}

		const body: Record<string, unknown> = {
			type: newType,
			prompt: newPrompt.trim(),
			correct_answer: correctAnswer,
		};
		if (options) body.options = options;

		const res = await fetch(`/api/quizzes/${quizId}/questions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (res.ok) {
			setShowNew(false);
			setNewPrompt("");
			setNewOptions("");
			setNewCorrect("");
			loadQuestions();
		} else {
			const data = await res.json();
			alert(data.error || "Failed to add question");
		}
		setSaving(false);
	}

	async function handleDelete(questionId: string) {
		if (!confirm("Delete this question?")) return;
		const res = await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
		if (res.ok) loadQuestions();
	}

	const correctAnswerDisplay = (q: Question) => {
		if (q.type === "short_text") return "(manual grade)";
		if (Array.isArray(q.correct_answer)) return q.correct_answer.join(", ");
		return String(q.correct_answer);
	};

	return (
		<div className="flex flex-col p-6 gap-6 max-w-2xl">
			<div className="flex items-center justify-between">
				<div>
					<span
						onClick={() => router.back()}
						className="text-xs cursor-pointer"
						style={{ color: "var(--brand-ink-60)" }}
					>
						&larr; Back to Quiz
					</span>
					<h1
						className="text-2xl font-semibold mt-1"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Question Builder
					</h1>
					<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
						{questions.length} question{questions.length !== 1 ? "s" : ""}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowNew(!showNew)}
					className="px-4 py-2 rounded-lg text-sm font-medium text-white"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					{showNew ? "Cancel" : "Add Question"}
				</button>
			</div>

			{showNew && (
				<form
					onSubmit={handleAddQuestion}
					className="rounded-xl p-6 border flex flex-col gap-4"
					style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
				>
					<h2 className="text-lg font-semibold" style={{ color: "var(--brand-ink)" }}>
						New Question
					</h2>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
							Type
						</label>
						<select
							value={newType}
							onChange={(e) => setNewType(e.target.value)}
							className="rounded-lg px-3 py-2 border text-sm max-w-[200px]"
							style={{
								borderColor: "var(--brand-ink-30)",
								backgroundColor: "white",
								color: "var(--brand-ink)",
							}}
						>
							{QUESTION_TYPES.map((t) => (
								<option key={t.value} value={t.value}>
									{t.label}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
							Question
						</label>
						<textarea
							value={newPrompt}
							onChange={(e) => setNewPrompt(e.target.value)}
							className="rounded-lg px-3 py-2 border text-sm"
							style={{
								borderColor: "var(--brand-ink-30)",
								backgroundColor: "white",
								color: "var(--brand-ink)",
							}}
							rows={2}
							placeholder="Enter your question"
							required
						/>
					</div>

					{(newType === "multiple_choice" || newType === "multi_select") && (
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
								Answer Options (one per line)
							</label>
							<textarea
								value={newOptions}
								onChange={(e) => setNewOptions(e.target.value)}
								className="rounded-lg px-3 py-2 border text-sm"
								style={{
									borderColor: "var(--brand-ink-30)",
									backgroundColor: "white",
									color: "var(--brand-ink)",
								}}
								rows={4}
								placeholder={"Option A\nOption B\nOption C\nOption D"}
							/>
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
							Correct Answer{" "}
							{newType === "multi_select"
								? "(one per line)"
								: newType === "short_text"
									? "(reference answer — manually graded)"
									: ""}
						</label>
						{newType === "short_text" ? (
							<input
								type="text"
								value={newCorrect}
								onChange={(e) => setNewCorrect(e.target.value)}
								className="rounded-lg px-3 py-2 border text-sm"
								style={{
									borderColor: "var(--brand-ink-30)",
									backgroundColor: "white",
									color: "var(--brand-ink)",
								}}
								placeholder="Reference answer for grading"
							/>
						) : (
							<textarea
								value={newCorrect}
								onChange={(e) => setNewCorrect(e.target.value)}
								className="rounded-lg px-3 py-2 border text-sm"
								style={{
									borderColor: "var(--brand-ink-30)",
									backgroundColor: "white",
									color: "var(--brand-ink)",
								}}
								rows={newType === "multi_select" ? 3 : 1}
								placeholder={
									newType === "multi_select"
										? "Correct Option 1\nCorrect Option 2"
										: newType === "true_false"
											? "True"
											: "Correct option text"
								}
							/>
						)}
					</div>

					<button
						type="submit"
						disabled={saving || !newPrompt.trim()}
						className="px-4 py-2 rounded-lg text-sm font-medium text-white self-start disabled:opacity-50"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						{saving ? "Adding..." : "Add Question"}
					</button>
				</form>
			)}

			{loading ? (
				<div className="p-4" />
			) : questions.length === 0 ? (
				<div
					className="rounded-xl p-8 border text-center"
					style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
				>
					<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
						No questions yet. Add your first question.
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{questions.map((q, i) => (
						<div
							key={q.id}
							className="rounded-xl p-4 border"
							style={{
								backgroundColor: "white",
								borderColor: "var(--brand-ink-30)",
							}}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<span
											className="text-xs font-mono"
											style={{ color: "var(--brand-ink-30)" }}
										>
											#{i + 1}
										</span>
										<span
											className="text-xs px-2 py-0.5 rounded"
											style={{
												backgroundColor: "var(--brand-chalk)",
												color: "var(--brand-ink-60)",
											}}
										>
											{QUESTION_TYPES.find((t) => t.value === q.type)?.label || q.type}
										</span>
									</div>
									<p className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
										{q.prompt}
									</p>
									{q.options && q.options.length > 0 && (
										<div className="flex flex-wrap gap-1 mt-1.5">
											{q.options.map((opt, oi) => {
												const isCorrect = Array.isArray(q.correct_answer)
													? q.correct_answer.includes(opt)
													: q.correct_answer === opt;
												return (
													<span
														key={oi}
														className="text-xs px-2 py-0.5 rounded"
														style={{
															backgroundColor: isCorrect
																? "var(--brand-verified-green)"
																: "var(--brand-chalk)",
															color: isCorrect ? "white" : "var(--brand-ink-60)",
														}}
													>
														{opt}
													</span>
												);
											})}
										</div>
									)}
									<p
										className="text-xs mt-1.5"
										style={{
											fontFamily: "var(--font-ibm-plex-mono)",
											color: "var(--brand-verified-green)",
										}}
									>
										Answer: {correctAnswerDisplay(q)}
									</p>
								</div>
								<button
									type="button"
									onClick={() => handleDelete(q.id)}
									className="text-xs px-2 py-1 rounded ml-2"
									style={{ color: "var(--brand-brick)" }}
								>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
