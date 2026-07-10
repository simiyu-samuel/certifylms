import { query } from "@/lib/db";
import { verifyDashboardAccess, getInstallationTier } from "@/lib/auth";
import { ok, created, badRequest, notFound, unauthorized, serverError } from "@/lib/api-utils";
import { TIER_LIMITS } from "@/lib/constants";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ moduleId: string }> },
) {
	try {
		const { moduleId } = await params;
		const mod = await query("SELECT * FROM modules WHERE id = $1", [moduleId]);
		if (!mod.rows[0]) return notFound("Module not found");

		const course = await query("SELECT * FROM courses WHERE id = $1", [mod.rows[0].course_id]);
		await verifyDashboardAccess(course.rows[0].whop_company_id);

		const result = await query("SELECT * FROM quizzes WHERE module_id = $1", [moduleId]);
		return ok(result.rows);
	} catch (e) {
		return serverError(e);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ moduleId: string }> },
) {
	try {
		const { moduleId } = await params;
		const mod = await query("SELECT * FROM modules WHERE id = $1", [moduleId]);
		if (!mod.rows[0]) return notFound("Module not found");

		const course = await query("SELECT * FROM courses WHERE id = $1", [mod.rows[0].course_id]);
		const companyId = course.rows[0].whop_company_id;
		await verifyDashboardAccess(companyId);

		const tier = await getInstallationTier(companyId);
		const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

		if (limits.maxQuizzes < Infinity) {
			const count = await query(
				"SELECT COUNT(*) FROM quizzes q JOIN modules m ON q.module_id = m.id JOIN courses c ON m.course_id = c.id WHERE c.whop_company_id = $1",
				[companyId],
			);
			if (Number(count.rows[0].count) >= limits.maxQuizzes) {
				return unauthorized("Free tier limited to 3 quizzes. Upgrade to Pro for more.");
			}
		}

		const body = await request.json();
		const { title, pass_threshold_pct, max_attempts, time_limit_seconds, randomize_order } = body;
		if (!title) return badRequest("title required");

		const result = await query(
			`INSERT INTO quizzes (module_id, title, pass_threshold_pct, max_attempts, time_limit_seconds, randomize_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
			[
				moduleId,
				title,
				pass_threshold_pct ?? 80.0,
				max_attempts ?? null,
				time_limit_seconds ?? null,
				randomize_order ?? false,
			],
		);
		return created(result.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}
