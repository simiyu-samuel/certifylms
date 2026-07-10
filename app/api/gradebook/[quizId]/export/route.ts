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

	const quiz = await query(
		`SELECT q.*, m.title AS module_title, m.course_id, c.title AS course_title, c.whop_company_id
		 FROM quizzes q
		 JOIN modules m ON q.module_id = m.id
		 JOIN courses c ON m.course_id = c.id
		 WHERE q.id = $1`,
		[quizId],
	);
	if (quiz.rows.length === 0) {
		return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
	}

	const companyId = quiz.rows[0].whop_company_id;
	const access = await whopsdk.users.checkAccess(companyId, { id: userId });
	if (!access.has_access) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const questions = await query(
		"SELECT id, type, prompt FROM questions WHERE quiz_id = $1 ORDER BY order_index",
		[quizId],
	);

	const attempts = await query(
		`SELECT id, whop_user_id, score_pct, passed, answers, submitted_at
		 FROM attempts WHERE quiz_id = $1 AND submitted_at IS NOT NULL
		 ORDER BY submitted_at DESC`,
		[quizId],
	);

	const headers_row = [
		"Student ID",
		"Score %",
		"Passed",
		"Submitted",
		...questions.rows.map((q: { prompt: string }, i: number) => `Q${i + 1}: ${q.prompt.replace(/"/g, "'")}`),
		...questions.rows.map((_q: unknown, i: number) => `Q${i + 1} Correct`),
	];

	const rows = attempts.rows.map((a: { whop_user_id: string; score_pct: string; passed: boolean; submitted_at: string; answers: unknown[] }) => {
		const parsed = a.answers as { questionId: string; answer: string | string[]; correct: boolean }[];
		const answersByQ = new Map(parsed.map((pa) => [pa.questionId, pa]));
		const answerVals = questions.rows.map((q: { id: string }) => {
			const pa = answersByQ.get(q.id);
			if (!pa) return "";
			const val = Array.isArray(pa.answer) ? pa.answer.join("; ") : pa.answer;
			return `"${String(val).replace(/"/g, '""')}"`;
		});
		const correctVals = questions.rows.map((q: { id: string }) => {
			const pa = answersByQ.get(q.id);
			return pa ? (pa.correct ? "Yes" : "No") : "";
		});
		return [
			a.whop_user_id,
			a.score_pct,
			a.passed ? "Yes" : "No",
			a.submitted_at ? new Date(a.submitted_at).toISOString() : "",
			...answerVals,
			...correctVals,
		].join(",");
	});

	const csv = [headers_row.join(","), ...rows].join("\n");

	return new NextResponse(csv, {
		headers: {
			"Content-Type": "text/csv",
			"Content-Disposition": `attachment; filename="${quiz.rows[0].course_title} - ${quiz.rows[0].title}.csv"`,
		},
	});
}
