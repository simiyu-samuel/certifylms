import { query } from "@/lib/db";
import { verifyDashboardAccess } from "@/lib/auth";
import { ok, created, badRequest, notFound, serverError } from "@/lib/api-utils";

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

		const result = await query(
			"SELECT * FROM questions WHERE quiz_id = $1 ORDER BY order_index ASC",
			[quizId],
		);
		return ok(result.rows);
	} catch (e) {
		return serverError(e);
	}
}

export async function POST(
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
		const { type, prompt, options, correct_answer, order_index } = body;
		if (!type || !prompt || !correct_answer) {
			return badRequest("type, prompt, and correct_answer required");
		}

		const validTypes = ["multiple_choice", "true_false", "multi_select", "short_text"];
		if (!validTypes.includes(type)) {
			return badRequest(`Invalid type. Must be one of: ${validTypes.join(", ")}`);
		}

		const maxOrder = await query(
			"SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM questions WHERE quiz_id = $1",
			[quizId],
		);

		const result = await query(
			`INSERT INTO questions (quiz_id, type, prompt, options, correct_answer, order_index)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
			[quizId, type, prompt, options ? JSON.stringify(options) : null, JSON.stringify(correct_answer), order_index ?? maxOrder.rows[0].next],
		);
		return created(result.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}
