import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ attemptId: string }> },
) {
	const { attemptId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());

	const attempt = await query(
		"SELECT * FROM attempts WHERE id = $1 AND whop_user_id = $2 AND submitted_at IS NULL",
		[attemptId, userId],
	);
	if (attempt.rows.length === 0) {
		return NextResponse.json({ error: "Attempt not found or already submitted" }, { status: 404 });
	}

	const { answers } = await request.json();
	if (!Array.isArray(answers)) {
		return NextResponse.json({ error: "answers must be an array" }, { status: 400 });
	}

	const attemptData = attempt.rows[0];
	const quiz = await query("SELECT * FROM quizzes WHERE id = $1", [attemptData.quiz_id]);
	if (quiz.rows.length === 0) {
		return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
	}

	const questions = await query(
		"SELECT id, type, correct_answer, options FROM questions WHERE quiz_id = $1",
		[attemptData.quiz_id],
	);

	const correctMap = new Map(
		questions.rows.map((q: { id: string; correct_answer: unknown }) => [q.id, q.correct_answer]),
	);

	let correctCount = 0;
	const graded = answers.map(
		(a: { questionId: string; answer: string | string[] }) => {
			const correct = correctMap.get(a.questionId);
			let isCorrect = false;
			if (Array.isArray(correct)) {
				const userAns = Array.isArray(a.answer) ? a.answer : [a.answer];
				isCorrect =
					correct.length === userAns.length &&
					(correct as string[]).every((c) => userAns.includes(c)) &&
					userAns.every((u) => correct.includes(u));
			} else {
				isCorrect = String(a.answer).trim().toLowerCase() === String(correct).trim().toLowerCase();
			}
			if (isCorrect) correctCount++;
			return { questionId: a.questionId, answer: a.answer, correct: isCorrect };
		},
	);

	const totalQuestions = questions.rows.length;
	const scorePct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
	const passed = scorePct >= Number(quiz.rows[0].pass_threshold_pct);

	await query(
		"UPDATE attempts SET answers = $1, score_pct = $2, passed = $3, submitted_at = NOW() WHERE id = $4",
		[JSON.stringify(graded), scorePct, passed, attemptId],
	);

	if (passed) {
		const moduleId = quiz.rows[0].module_id;
		const mod = await query("SELECT course_id FROM modules WHERE id = $1", [moduleId]);
		if (mod.rows.length > 0) {
			const courseId = mod.rows[0].course_id;
			await query(
				`INSERT INTO student_progress (course_id, whop_user_id, module_id, status, completed_at)
				 VALUES ($1, $2, $3, 'completed', NOW())
				 ON CONFLICT (course_id, whop_user_id, module_id)
				 DO UPDATE SET status = 'completed', completed_at = NOW()`,
				[courseId, userId, moduleId],
			);

			const nextModules = await query(
				`SELECT id FROM modules WHERE course_id = $1 AND unlock_rule = 'previous_quiz_passed'
				 AND order_index > (SELECT order_index FROM modules WHERE id = $2)
				 ORDER BY order_index ASC LIMIT 1`,
				[courseId, moduleId],
			);
			if (nextModules.rows.length > 0) {
				await query(
					`INSERT INTO student_progress (course_id, whop_user_id, module_id, status)
					 VALUES ($1, $2, $3, 'unlocked')
					 ON CONFLICT (course_id, whop_user_id, module_id) DO NOTHING`,
					[courseId, userId, nextModules.rows[0].id],
				);
			}
		}
	}

	return NextResponse.json({
		scorePct,
		passed,
		correctCount,
		totalQuestions,
		passThreshold: Number(quiz.rows[0].pass_threshold_pct),
		graded,
	});
}
