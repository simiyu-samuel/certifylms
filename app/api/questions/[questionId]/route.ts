import { query } from "@/lib/db";
import { verifyDashboardAccess } from "@/lib/auth";
import { ok, badRequest, notFound, serverError } from "@/lib/api-utils";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ questionId: string }> },
) {
	try {
		const { questionId } = await params;
		const existing = await query("SELECT * FROM questions WHERE id = $1", [questionId]);
		if (!existing.rows[0]) return notFound("Question not found");

		const quiz = await query("SELECT * FROM quizzes WHERE id = $1", [
			existing.rows[0].quiz_id,
		]);
		if (!quiz.rows[0]) return notFound("Quiz not found");

		const mod = await query("SELECT * FROM modules WHERE id = $1", [quiz.rows[0].module_id]);
		const course = await query("SELECT * FROM courses WHERE id = $1", [mod.rows[0].course_id]);
		await verifyDashboardAccess(course.rows[0].whop_company_id);

		const body = await request.json();
		const { type, prompt, options, correct_answer, order_index } = body;

		const result = await query(
			`UPDATE questions SET
        type = COALESCE($1, type),
        prompt = COALESCE($2, prompt),
        options = COALESCE($3, options),
        correct_answer = COALESCE($4, correct_answer),
        order_index = COALESCE($5, order_index)
      WHERE id = $6 RETURNING *`,
			[
				type || null,
				prompt || null,
				options ? JSON.stringify(options) : null,
				correct_answer ? JSON.stringify(correct_answer) : null,
				order_index ?? null,
				questionId,
			],
		);
		return ok(result.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ questionId: string }> },
) {
	try {
		const { questionId } = await params;
		const existing = await query("SELECT * FROM questions WHERE id = $1", [questionId]);
		if (!existing.rows[0]) return notFound("Question not found");

		const quiz = await query("SELECT * FROM quizzes WHERE id = $1", [
			existing.rows[0].quiz_id,
		]);
		if (!quiz.rows[0]) return notFound("Quiz not found");

		const mod = await query("SELECT * FROM modules WHERE id = $1", [quiz.rows[0].module_id]);
		const course = await query("SELECT * FROM courses WHERE id = $1", [mod.rows[0].course_id]);
		await verifyDashboardAccess(course.rows[0].whop_company_id);

		await query("DELETE FROM questions WHERE id = $1", [questionId]);
		return ok({ deleted: true });
	} catch (e) {
		return serverError(e);
	}
}
