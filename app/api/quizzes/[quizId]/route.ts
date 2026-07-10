import { query } from "@/lib/db";
import { verifyDashboardAccess } from "@/lib/auth";
import { ok, badRequest, notFound, serverError } from "@/lib/api-utils";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ quizId: string }> },
) {
	try {
		const { quizId } = await params;
		const quiz = await query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
		if (!quiz.rows[0]) return notFound("Quiz not found");

		const mod = await query("SELECT * FROM modules WHERE id = $1", [quiz.rows[0].module_id]);
		const course = await query("SELECT * FROM courses WHERE id = $1", [mod.rows[0].course_id]);
		await verifyDashboardAccess(course.rows[0].whop_company_id);

		return ok(quiz.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ quizId: string }> },
) {
	try {
		const { quizId } = await params;
		const quiz = await query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
		if (!quiz.rows[0]) return notFound("Quiz not found");

		const mod = await query("SELECT * FROM modules WHERE id = $1", [quiz.rows[0].module_id]);
		const course = await query("SELECT * FROM courses WHERE id = $1", [mod.rows[0].course_id]);
		await verifyDashboardAccess(course.rows[0].whop_company_id);

		const body = await request.json();
		const { title, pass_threshold_pct, max_attempts, time_limit_seconds, randomize_order } =
			body;

		const result = await query(
			`UPDATE quizzes SET
        title = COALESCE($1, title),
        pass_threshold_pct = COALESCE($2, pass_threshold_pct),
        max_attempts = COALESCE($3, max_attempts),
        time_limit_seconds = COALESCE($4, time_limit_seconds),
        randomize_order = COALESCE($5, randomize_order)
      WHERE id = $6 RETURNING *`,
			[
				title || null,
				pass_threshold_pct ?? null,
				max_attempts ?? null,
				time_limit_seconds ?? null,
				randomize_order ?? null,
				quizId,
			],
		);
		return ok(result.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ quizId: string }> },
) {
	try {
		const { quizId } = await params;
		const quiz = await query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
		if (!quiz.rows[0]) return notFound("Quiz not found");

		const mod = await query("SELECT * FROM modules WHERE id = $1", [quiz.rows[0].module_id]);
		const course = await query("SELECT * FROM courses WHERE id = $1", [mod.rows[0].course_id]);
		await verifyDashboardAccess(course.rows[0].whop_company_id);

		await query("DELETE FROM quizzes WHERE id = $1", [quizId]);
		return ok({ deleted: true });
	} catch (e) {
		return serverError(e);
	}
}
