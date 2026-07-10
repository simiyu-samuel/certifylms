import { query } from "@/lib/db";
import { verifyDashboardAccess } from "@/lib/auth";
import { ok, created, badRequest, notFound, serverError } from "@/lib/api-utils";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ courseId: string }> },
) {
	try {
		const { courseId } = await params;
		const course = await query("SELECT * FROM courses WHERE id = $1", [courseId]);
		if (!course.rows[0]) return notFound("Course not found");

		await verifyDashboardAccess(course.rows[0].whop_company_id);

		const result = await query(
			"SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index ASC",
			[courseId],
		);
		return ok(result.rows);
	} catch (e) {
		return serverError(e);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ courseId: string }> },
) {
	try {
		const { courseId } = await params;
		const course = await query("SELECT * FROM courses WHERE id = $1", [courseId]);
		if (!course.rows[0]) return notFound("Course not found");

		await verifyDashboardAccess(course.rows[0].whop_company_id);

		const body = await request.json();
		const { title, whop_lesson_id, unlock_rule, unlock_date } = body;
		if (!title) return badRequest("title required");

		const maxOrder = await query(
			"SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM modules WHERE course_id = $1",
			[courseId],
		);
		const orderIndex = body.order_index ?? maxOrder.rows[0].next;

		const result = await query(
			`INSERT INTO modules (course_id, title, whop_lesson_id, order_index, unlock_rule, unlock_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
			[
				courseId,
				title,
				whop_lesson_id || null,
				orderIndex,
				unlock_rule || "always",
				unlock_date || null,
			],
		);
		return created(result.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}
