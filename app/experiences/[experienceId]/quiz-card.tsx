import Link from "next/link";
import { HelpCircle, CheckCircle2, XCircle } from "lucide-react";

type Quiz = {
	id: string;
	title: string;
	pass_threshold_pct: string;
	max_attempts: number | null;
	time_limit_seconds: number | null;
};

type Attempt = {
	id: string;
	score_pct: string | null;
	passed: boolean;
	submitted_at: string | null;
};

export function ExperienceQuizCard({
	experienceId,
	quiz,
	questionCount,
	bestAttempt,
	attemptCount,
}: {
	experienceId: string;
	quiz: Quiz;
	questionCount: number;
	bestAttempt: Attempt | null;
	attemptCount: number;
}) {
	const maxAttempts = quiz.max_attempts;
	const attemptsRemaining = maxAttempts != null ? Math.max(0, maxAttempts - attemptCount) : null;
	const canTake = attemptsRemaining === null || attemptsRemaining > 0;

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3 flex-1 min-w-0">
				<HelpCircle
					size={16}
					style={{ color: "var(--brand-seal-gold)", flexShrink: 0 }}
				/>
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span
							className="text-sm font-medium truncate"
							style={{ color: "var(--brand-ink)" }}
						>
							{quiz.title}
						</span>
						{bestAttempt?.passed && (
							<span className="flex items-center gap-1 text-xs" style={{ color: "var(--brand-verified-green)" }}>
								<CheckCircle2 size={12} />
								Passed
							</span>
						)}
						{bestAttempt && !bestAttempt.passed && (
							<span className="flex items-center gap-1 text-xs" style={{ color: "var(--brand-brick)" }}>
								<XCircle size={12} />
								Failed
							</span>
						)}
					</div>
					<div className="flex items-center gap-2 mt-0.5">
						<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
							{questionCount} question{questionCount !== 1 ? "s" : ""}
						</span>
						<span className="text-xs" style={{ color: "var(--brand-ink-30)" }}>·</span>
						<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
							Pass: {quiz.pass_threshold_pct}%
						</span>
						{quiz.max_attempts != null && (
							<>
								<span className="text-xs" style={{ color: "var(--brand-ink-30)" }}>·</span>
								<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
									{attemptsRemaining != null ? `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? "s" : ""} left` : "Unlimited attempts"}
								</span>
							</>
						)}
						{quiz.time_limit_seconds && (
							<>
								<span className="text-xs" style={{ color: "var(--brand-ink-30)" }}>·</span>
								<span className="text-xs" style={{ color: "var(--brand-ink-60)" }}>
									{Math.floor(quiz.time_limit_seconds / 60)} min
								</span>
							</>
						)}
					</div>
				</div>
			</div>
			{bestAttempt?.passed ? (
				<Link
					href={`/experiences/${experienceId}/quiz/${quiz.id}/review`}
					className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:shadow-md flex-shrink-0"
					style={{ backgroundColor: "var(--brand-verified-green)", color: "white" }}
				>
					Review
				</Link>
			) : (
				<Link
					href={`/experiences/${experienceId}/quiz/${quiz.id}`}
					className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
						canTake ? "hover:opacity-90 hover:shadow-md" : "pointer-events-none"
					}`}
					style={{
						backgroundColor: canTake ? "var(--brand-seal-gold)" : "var(--brand-ink-30)",
						color: "white",
					}}
				>
					{canTake ? "Take Quiz" : "No attempts left"}
				</Link>
			)}
		</div>
	);
}
