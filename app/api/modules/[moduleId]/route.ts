import { query } from "@/lib/db";
import { verifyDashboardAccess } from "@/lib/auth";
import { ok, badRequest, notFound, serverError } from "@/lib/api-utils";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ moduleId: string }> },
) {
	try {
		const { moduleId } = await params;
		const existing = await query("SELECT * FROM modules WHERE id = $1", [moduleId]);
		if (!existing.rows[0]) return notFound("Module not found");

		const course = await query("SELECT * FROM courses WHERE id = $1", [
			existing.rows[0].course_id,
		]);
		await verifyDashboardAccess(course.rows[0].whop_company_id);

		const body = await request.json();
		const { title, whop_lesson_id, order_index, unlock_rule, unlock_date, content } = body;

		const result = await query(
			`UPDATE modules SET
        title = COALESCE($1, title),
        whop_lesson_id = COALESCE($2, whop_lesson_id),
        order_index = COALESCE($3, order_index),
        unlock_rule = COALESCE($4, unlock_rule),
        unlock_date = COALESCE($5, unlock_date),
        content = COALESCE($6, content)
      WHERE id = $7 RETURNING *`,
			[title || null, whop_lesson_id, order_index, unlock_rule, unlock_date, content, moduleId],
		);
		return ok(result.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ moduleId: string }> },
) {
	try {
		const { moduleId } = await params;
		const existing = await query("SELECT * FROM modules WHERE id = $1", [moduleId]);
		if (!existing.rows[0]) return notFound("Module not found");

		const course = await query("SELECT * FROM courses WHERE id = $1", [
			existing.rows[0].course_id,
		]);
		await verifyDashboardAccess(course.rows[0].whop_company_id);

		await query("DELETE FROM modules WHERE id = $1", [moduleId]);
		return ok({ deleted: true });
	} catch (e) {
		return serverError(e);
	}
}
