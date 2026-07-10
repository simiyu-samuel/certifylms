import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";

export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ quizId: string }> },
) {
	const { quizId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());

	const quiz = await query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
	if (quiz.rows.length === 0) {
		return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
	}

	const quizData = quiz.rows[0];

	if (quizData.max_attempts != null) {
		const previous = await query(
			"SELECT COUNT(*) AS count FROM attempts WHERE quiz_id = $1 AND whop_user_id = $2",
			[quizId, userId],
		);
		if (Number(previous.rows[0].count) >= quizData.max_attempts) {
			return NextResponse.json({ error: "No attempts remaining" }, { status: 403 });
		}
	}

	let questions = await query(
		"SELECT id, type, prompt, options, order_index FROM questions WHERE quiz_id = $1 ORDER BY order_index ASC",
		[quizId],
	);

	if (quizData.randomize_order) {
		questions.rows = questions.rows.sort(() => Math.random() - 0.5);
	}

	const attempt = await query(
		`INSERT INTO attempts (quiz_id, whop_user_id) VALUES ($1, $2) RETURNING id, started_at`,
		[quizId, userId],
	);

	const safeQuestions = questions.rows.map((q: { id: string; type: string; prompt: string; options: unknown }) => ({
		id: q.id,
		type: q.type,
		prompt: q.prompt,
		options: q.type === "short_text" ? undefined : q.options,
	}));

	return NextResponse.json({
		attempt: attempt.rows[0],
		questions: safeQuestions,
		timeLimitSeconds: quizData.time_limit_seconds,
	});
}
