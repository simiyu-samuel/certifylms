import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";

export async function POST(request: Request) {
	const { userId } = await whopsdk.verifyUserToken(await headers());

	const { attemptId, questionId, correct } = await request.json();
	if (!attemptId || !questionId || typeof correct !== "boolean") {
		return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
	}

	const attempt = await query(
		`SELECT a.*, q.course_id FROM attempts a
		 JOIN quizzes qz ON a.quiz_id = qz.id
		 JOIN modules m ON qz.module_id = m.id
		 JOIN courses q ON m.course_id = q.id
		 WHERE a.id = $1`,
		[attemptId],
	);
	if (attempt.rows.length === 0) {
		return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
	}

	const course = await query(
		"SELECT whop_company_id FROM courses WHERE id = $1",
		[attempt.rows[0].course_id],
	);

	const companyId = course.rows[0].whop_company_id;
	const access = await whopsdk.users.checkAccess(companyId, { id: userId });
	if (!access.has_access) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const answers = attempt.rows[0].answers as { questionId: string; answer: unknown; correct: boolean }[];
	const updated = answers.map((a: { questionId: string; answer: unknown; correct: boolean }) =>
		a.questionId === questionId ? { ...a, correct } : a,
	);

	const correctCount = updated.filter((a: { correct: boolean }) => a.correct).length;
	const totalQuestions = updated.length;
	const scorePct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

	const quiz = await query("SELECT pass_threshold_pct FROM quizzes WHERE id = $1", [attempt.rows[0].quiz_id]);
	const passed = scorePct >= Number(quiz.rows[0].pass_threshold_pct);

	await query(
		"UPDATE attempts SET answers = $1, score_pct = $2, passed = $3 WHERE id = $4",
		[updated, scorePct, passed, attemptId],
	);

	return NextResponse.json({ scorePct, passed, questionId, correct });
}
