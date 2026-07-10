import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";

export async function POST(request: Request) {
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const { courseId, moduleId, moduleOrderIndex } = await request.json();

	await query(
		`INSERT INTO student_progress (course_id, whop_user_id, module_id, status, completed_at)
		 VALUES ($1, $2, $3, 'completed', NOW())
		 ON CONFLICT (course_id, whop_user_id, module_id)
		 DO UPDATE SET status = 'completed', completed_at = NOW()`,
		[courseId, userId, moduleId],
	);

	const nextModules = await query(
		`SELECT id FROM modules WHERE course_id = $1 AND unlock_rule = 'previous_quiz_passed'
		 AND order_index > $2 ORDER BY order_index ASC LIMIT 1`,
		[courseId, moduleOrderIndex],
	);

	if (nextModules.rows.length > 0) {
		await query(
			`INSERT INTO student_progress (course_id, whop_user_id, module_id, status)
			 VALUES ($1, $2, $3, 'unlocked')
			 ON CONFLICT (course_id, whop_user_id, module_id) DO NOTHING`,
			[courseId, userId, nextModules.rows[0].id],
		);
	}

	return NextResponse.json({ ok: true });
}
