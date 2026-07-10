"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/toast";
import {
	ArrowLeft,
	Plus,
	Save,
	Trash2,
	ChevronUp,
	ChevronDown,
	Loader2,
	FileQuestion,
	ListChecks,
	CheckCircle2,
	Type,
	HelpCircle,
} from "lucide-react";

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
	{ value: "multiple_choice", label: "Multiple Choice", icon: ListChecks },
	{ value: "true_false", label: "True / False", icon: CheckCircle2 },
	{ value: "multi_select", label: "Multi-Select", icon: ListChecks },
	{ value: "short_text", label: "Short Text", icon: Type },
] as const;

const TYPE_COLORS: Record<string, string> = {
	multiple_choice: "#2F9E68",
	true_false: "#C79A3B",
	multi_select: "#4A4B63",
	short_text: "#B5533F",
};

const typeIcons: Record<string, typeof ListChecks> = {
	multiple_choice: ListChecks,
	true_false: CheckCircle2,
	multi_select: ListChecks,
	short_text: Type,
};

function QuestionForm({
	type,
	prompt,
	options,
	correctAnswer,
	onTypeChange,
	onPromptChange,
	onOptionsChange,
	onCorrectChange,
}: {
	type: string;
	prompt: string;
	options: string;
	correctAnswer: string;
	onTypeChange: (v: string) => void;
	onPromptChange: (v: string) => void;
	onOptionsChange: (v: string) => void;
	onCorrectChange: (v: string) => void;
}) {
	return (
		<>
			<div className="flex flex-col gap-1.5">
				<label className="text-xs font-semibold" style={{ color: "var(--brand-ink)" }}>
					Type
				</label>
				<select
					value={type}
					onChange={(e) => onTypeChange(e.target.value)}
					className="rounded-lg px-3 py-2 border text-sm outline-none focus:ring-2 transition-shadow max-w-[200px]"
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
				<label className="text-xs font-semibold" style={{ color: "var(--brand-ink)" }}>
					Question
				</label>
				<textarea
					value={prompt}
					onChange={(e) => onPromptChange(e.target.value)}
					className="rounded-lg px-3 py-2 border text-sm outline-none focus:ring-2 transition-shadow resize-none"
					style={{
						borderColor: "var(--brand-ink-30)",
						backgroundColor: "white",
						color: "var(--brand-ink)",
					}}
					rows={2}
					placeholder="Enter your question"
				/>
			</div>

			{(type === "multiple_choice" || type === "multi_select") && (
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-semibold" style={{ color: "var(--brand-ink)" }}>
						Answer Options (one per line)
					</label>
					<textarea
						value={options}
						onChange={(e) => onOptionsChange(e.target.value)}
						className="rounded-lg px-3 py-2 border text-sm outline-none focus:ring-2 transition-shadow resize-none"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
						rows={4}
						placeholder="Option A\nOption B\nOption C\nOption D"
					/>
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<label className="text-xs font-semibold" style={{ color: "var(--brand-ink)" }}>
					Correct Answer
					{type === "multi_select" && " (one per line)"}
					{type === "short_text" && " (reference — manually graded)"}
				</label>
				{type === "short_text" ? (
					<input
						type="text"
						value={correctAnswer}
						onChange={(e) => onCorrectChange(e.target.value)}
						className="rounded-lg px-3 py-2 border text-sm outline-none focus:ring-2 transition-shadow"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
						placeholder="Reference answer for grading"
					/>
				) : (
					<textarea
						value={correctAnswer}
						onChange={(e) => onCorrectChange(e.target.value)}
						className="rounded-lg px-3 py-2 border text-sm outline-none focus:ring-2 transition-shadow resize-none"
						style={{
							borderColor: "var(--brand-ink-30)",
							backgroundColor: "white",
							color: "var(--brand-ink)",
						}}
						rows={type === "multi_select" ? 3 : 1}
						placeholder={
							type === "multi_select"
								? "Correct Option 1\nCorrect Option 2"
								: type === "true_false"
									? "True"
									: "Correct option text"
						}
					/>
				)}
			</div>
		</>
	);
}

export default function QuizBuilderPage() {
	const { companyId, courseId, moduleId, quizId } = useParams<{
		companyId: string;
		courseId: string;
		moduleId: string;
		quizId: string;
	}>();

	const router = useRouter();
	const { toast } = useToast();
	const [questions, setQuestions] = useState<Question[]>([]);
	const [loading, setLoading] = useState(true);
	const [showNew, setShowNew] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const [newType, setNewType] = useState<string>("multiple_choice");
	const [newPrompt, setNewPrompt] = useState("");
	const [newOptions, setNewOptions] = useState("");
	const [newCorrect, setNewCorrect] = useState("");
	const [saving, setSaving] = useState(false);

	const loadQuestions = useCallback(async () => {
		const res = await fetch(`/api/quizzes/${quizId}/questions`);
		if (res.ok) setQuestions(await res.json());
		setLoading(false);
	}, [quizId]);

	useEffect(() => {
		loadQuestions();
	}, [loadQuestions]);

	async function handleAddQuestion(e: React.FormEvent) {
		e.preventDefault();
		if (!newPrompt.trim()) return;
		setSaving(true);

		let opts: string[] | null = null;
		let correct: string | string[] = newCorrect.trim();

		if (newType === "multiple_choice" || newType === "multi_select") {
			opts = newOptions.split("\n").map((s) => s.trim()).filter(Boolean);
			if (newType === "multi_select") {
				correct = newCorrect.split("\n").map((s) => s.trim()).filter(Boolean);
			}
		}
		if (newType === "true_false") opts = ["True", "False"];

		const body: Record<string, unknown> = {
			type: newType,
			prompt: newPrompt.trim(),
			correct_answer: correct,
		};
		if (opts) body.options = opts;

		const res = await fetch(`/api/quizzes/${quizId}/questions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (res.ok) {
			toast("Question added", "success");
			setShowNew(false);
			setNewPrompt("");
			setNewOptions("");
			setNewCorrect("");
			loadQuestions();
		} else {
			const data = await res.json();
			toast(data.error || "Failed to add question", "error");
		}
		setSaving(false);
	}

	async function handleUpdate(questionId: string, data: Record<string, unknown>) {
		const res = await fetch(`/api/questions/${questionId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (res.ok) {
			toast("Question updated", "success");
			setEditingId(null);
			loadQuestions();
		} else {
			toast("Failed to update question", "error");
		}
	}

	async function handleDelete(questionId: string) {
		const res = await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
		if (res.ok) {
			toast("Question deleted", "info");
			loadQuestions();
		} else {
			toast("Failed to delete question", "error");
		}
	}

	const typeCounts = questions.reduce(
		(acc, q) => {
			acc[q.type] = (acc[q.type] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	return (
		<div className="flex flex-col p-8 gap-8 max-w-3xl">
			<div className="flex items-start justify-between">
				<div>
					<button
						type="button"
						onClick={() =>
							router.push(
								`/dashboard/${companyId}/courses/${courseId}/modules/${moduleId}/quiz/${quizId}`,
							)
						}
						className="inline-flex items-center gap-1 text-sm mb-2"
						style={{ color: "var(--brand-ink-60)" }}
					>
						<ArrowLeft size={14} />
						Back to Quiz
					</button>
					<h1
						className="text-3xl font-semibold"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						Question Builder
					</h1>
					<p className="text-sm mt-1" style={{ color: "var(--brand-ink-60)" }}>
						{questions.length} question{questions.length !== 1 ? "s" : ""}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowNew(!showNew)}
					className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					<Plus size={16} />
					{showNew ? "Cancel" : "Add Question"}
				</button>
			</div>

			{questions.length > 0 && (
				<div className="flex gap-2 flex-wrap">
					{QUESTION_TYPES.map((qt) => {
						const Icon = qt.icon;
						const count = typeCounts[qt.value] || 0;
						if (!count) return null;
						return (
							<div
								key={qt.value}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
								style={{
									backgroundColor: TYPE_COLORS[qt.value] + "15",
									color: TYPE_COLORS[qt.value],
								}}
							>
								<Icon size={12} />
								{qt.label}: {count}
							</div>
						);
					})}
				</div>
			)}

			{showNew && (
				<form
					onSubmit={handleAddQuestion}
					className="rounded-xl p-6 border flex flex-col gap-4"
					style={{
						backgroundColor: "white",
						borderColor: "var(--brand-seal-gold)",
					}}
				>
					<h2 className="text-base font-semibold" style={{ color: "var(--brand-ink)" }}>
						New Question
					</h2>
					<QuestionForm
						type={newType}
						prompt={newPrompt}
						options={newOptions}
						correctAnswer={newCorrect}
						onTypeChange={setNewType}
						onPromptChange={setNewPrompt}
						onOptionsChange={setNewOptions}
						onCorrectChange={setNewCorrect}
					/>
					<button
						type="submit"
						disabled={saving || !newPrompt.trim()}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white self-start transition-opacity hover:opacity-90 disabled:opacity-50"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						{saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
						{saving ? "Adding..." : "Add Question"}
					</button>
				</form>
			)}

			{loading ? (
				<div className="flex items-center gap-2 py-8" style={{ color: "var(--brand-ink-60)" }}>
					<Loader2 size={16} className="animate-spin" />
					<span className="text-sm">Loading questions...</span>
				</div>
			) : questions.length === 0 && !showNew ? (
				<div
					className="rounded-xl p-12 border text-center"
					style={{ backgroundColor: "white", borderColor: "var(--brand-ink-30)" }}
				>
					<FileQuestion
						size={48}
						className="mx-auto mb-4"
						style={{ color: "var(--brand-ink-30)" }}
					/>
					<p className="text-base font-medium" style={{ color: "var(--brand-ink)" }}>
						No questions yet
					</p>
					<p className="text-sm mt-1 mb-5" style={{ color: "var(--brand-ink-60)" }}>
						Add your first question to this quiz.
					</p>
					<button
						type="button"
						onClick={() => setShowNew(true)}
						className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
						style={{ backgroundColor: "var(--brand-seal-gold)" }}
					>
						<Plus size={16} />
						Add Question
					</button>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{questions.map((q, i) => {
						const isEditing = editingId === q.id;
						const TypeIcon = typeIcons[q.type] || FileQuestion;
						const typeLabel = QUESTION_TYPES.find((t) => t.value === q.type)?.label || q.type;

						const correctDisplay = (question: Question) => {
							if (question.type === "short_text") return "(manually graded)";
							if (Array.isArray(question.correct_answer))
								return question.correct_answer.join(", ");
							return String(question.correct_answer);
						};

						return (
							<div
								key={q.id}
								className="rounded-xl border overflow-hidden transition-shadow hover:shadow-sm"
								style={{
									backgroundColor: "white",
									borderColor: isEditing ? "var(--brand-seal-gold)" : "var(--brand-ink-30)",
								}}
							>
								{isEditing ? (
									<div className="p-5 flex flex-col gap-4">
										<div className="flex items-center justify-between">
											<h3 className="text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
												Edit Question #{i + 1}
											</h3>
											<button
												type="button"
												onClick={() => setEditingId(null)}
												className="text-xs"
												style={{ color: "var(--brand-ink-60)" }}
											>
												Cancel
											</button>
										</div>
										<InlineEditForm
											question={q}
											onSave={(data) => handleUpdate(q.id, data)}
										/>
									</div>
								) : (
									<div className="p-5">
										<div className="flex items-start justify-between">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1.5">
													<span
														className="text-xs font-mono px-1.5 py-0.5 rounded"
														style={{
															backgroundColor: "var(--brand-chalk)",
															color: "var(--brand-ink-60)",
														}}
													>
														#{i + 1}
													</span>
													<div
														className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
														style={{
															backgroundColor: TYPE_COLORS[q.type] + "15",
															color: TYPE_COLORS[q.type],
														}}
													>
														<TypeIcon size={11} />
														{typeLabel}
													</div>
												</div>
												<p
													className="text-sm font-medium leading-relaxed"
													style={{ color: "var(--brand-ink)" }}
												>
													{q.prompt}
												</p>
												{q.options && q.options.length > 0 && (
													<div className="flex flex-wrap gap-1.5 mt-2">
														{q.options.map((opt, oi) => {
															const isCorrect = Array.isArray(q.correct_answer)
																? q.correct_answer.includes(opt)
																: q.correct_answer === opt;
															return (
																<span
																	key={oi}
																	className="text-xs px-2.5 py-1 rounded-full border"
																	style={{
																		backgroundColor: isCorrect
																			? "var(--brand-verified-green)"
																			: "white",
																		borderColor: isCorrect
																			? "var(--brand-verified-green)"
																			: "var(--brand-ink-30)",
																		color: isCorrect ? "white" : "var(--brand-ink-60)",
																	}}
																>
																	{isCorrect && <CheckCircle2 size={10} className="inline mr-1" />}
																	{opt}
																</span>
															);
														})}
													</div>
												)}
												<p
													className="text-xs mt-2"
													style={{
														fontFamily: "var(--font-ibm-plex-mono)",
														color: "var(--brand-verified-green)",
													}}
												>
													Answer: {correctDisplay(q)}
												</p>
											</div>
											<div className="flex items-center gap-1 ml-4">
												<button
													type="button"
													onClick={() => setEditingId(q.id)}
													className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
													title="Edit"
												>
													<Save size={14} style={{ color: "var(--brand-ink-60)" }} />
												</button>
												<button
													type="button"
													onClick={() => handleDelete(q.id)}
													className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
													title="Delete"
												>
													<Trash2 size={14} style={{ color: "var(--brand-brick)" }} />
												</button>
											</div>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

function InlineEditForm({
	question,
	onSave,
}: {
	question: Question;
	onSave: (data: Record<string, unknown>) => void;
}) {
	const [type, setType] = useState<string>(question.type);
	const [prompt, setPrompt] = useState(question.prompt);
	const [options, setOptions] = useState(
		question.options?.join("\n") || "",
	);
	const [correctAnswer, setCorrectAnswer] = useState(
		Array.isArray(question.correct_answer)
			? question.correct_answer.join("\n")
			: question.correct_answer,
	);

	function handleSave() {
		let opts: string[] | null = null;
		let correct: string | string[] = correctAnswer.trim();

		if (type === "multiple_choice" || type === "multi_select") {
			opts = options.split("\n").map((s) => s.trim()).filter(Boolean);
			if (type === "multi_select") {
				correct = correctAnswer.split("\n").map((s) => s.trim()).filter(Boolean);
			}
		}
		if (type === "true_false") opts = ["True", "False"];

		const data: Record<string, unknown> = {
			type,
			prompt: prompt.trim(),
			correct_answer: correct,
		};
		if (opts) data.options = opts;
		onSave(data);
	}

	return (
		<div className="flex flex-col gap-4">
			<QuestionForm
				type={type}
				prompt={prompt}
				options={options}
				correctAnswer={correctAnswer}
				onTypeChange={setType}
				onPromptChange={setPrompt}
				onOptionsChange={setOptions}
				onCorrectChange={setCorrectAnswer}
			/>
			<button
				type="button"
				onClick={handleSave}
				className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white self-start transition-opacity hover:opacity-90"
				style={{ backgroundColor: "var(--brand-seal-gold)" }}
			>
				<Save size={14} />
				Save Question
			</button>
		</div>
	);
}
