import { query } from "@/lib/db";
import { verifyDashboardAccess } from "@/lib/auth";
import { ok, badRequest, notFound, serverError } from "@/lib/api-utils";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ courseId: string }> },
) {
	try {
		const { courseId } = await params;
		const result = await query("SELECT * FROM courses WHERE id = $1", [courseId]);
		if (!result.rows[0]) return notFound("Course not found");

		await verifyDashboardAccess(result.rows[0].whop_company_id);
		return ok(result.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ courseId: string }> },
) {
	try {
		const { courseId } = await params;
		const existing = await query("SELECT * FROM courses WHERE id = $1", [courseId]);
		if (!existing.rows[0]) return notFound("Course not found");

		await verifyDashboardAccess(existing.rows[0].whop_company_id);

		const body = await request.json();
		const { title, description } = body;

		const result = await query(
			"UPDATE courses SET title = COALESCE($1, title), description = COALESCE($2, description) WHERE id = $3 RETURNING *",
			[title || null, description !== undefined ? description : null, courseId],
		);
		return ok(result.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ courseId: string }> },
) {
	try {
		const { courseId } = await params;
		const existing = await query("SELECT * FROM courses WHERE id = $1", [courseId]);
		if (!existing.rows[0]) return notFound("Course not found");

		await verifyDashboardAccess(existing.rows[0].whop_company_id);

		await query("DELETE FROM courses WHERE id = $1", [courseId]);
		return ok({ deleted: true });
	} catch (e) {
		return serverError(e);
	}
}
