import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ quizId: string }> },
) {
	const { quizId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());

	const attempt = await query(
		`SELECT * FROM attempts
		 WHERE quiz_id = $1 AND whop_user_id = $2 AND submitted_at IS NOT NULL
		 ORDER BY submitted_at DESC LIMIT 1`,
		[quizId, userId],
	);

	if (attempt.rows.length === 0) {
		return NextResponse.json({ error: "No attempts found" }, { status: 404 });
	}

	const questions = await query(
		"SELECT id, type, prompt, options, correct_answer, order_index FROM questions WHERE quiz_id = $1 ORDER BY order_index ASC",
		[quizId],
	);

	return NextResponse.json({
		attempt: attempt.rows[0],
		questions: questions.rows,
	});
}
