import { query } from "@/lib/db";
import { verifyDashboardAccess, getInstallationTier } from "@/lib/auth";
import { ok, created, badRequest, unauthorized, serverError } from "@/lib/api-utils";
import { TIER_LIMITS } from "@/lib/constants";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const companyId = searchParams.get("companyId");
		if (!companyId) return badRequest("companyId required");

		await verifyDashboardAccess(companyId);

		const result = await query(
			"SELECT * FROM courses WHERE whop_company_id = $1 ORDER BY created_at DESC",
			[companyId],
		);
		return ok(result.rows);
	} catch (e) {
		return serverError(e);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { companyId, title, description } = body;
		if (!companyId || !title) return badRequest("companyId and title required");

		await verifyDashboardAccess(companyId);

		const tier = await getInstallationTier(companyId);
		const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

		if (limits.maxCourses < Infinity) {
			const count = await query(
				"SELECT COUNT(*) FROM courses WHERE whop_company_id = $1",
				[companyId],
			);
			if (Number(count.rows[0].count) >= limits.maxCourses) {
				return unauthorized("Free tier limited to 1 course. Upgrade to Pro for more.");
			}
		}

		const result = await query(
			"INSERT INTO courses (whop_company_id, title, description) VALUES ($1, $2, $3) RETURNING *",
			[companyId, title, description || null],
		);
		return created(result.rows[0]);
	} catch (e) {
		return serverError(e);
	}
}
