import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { query } from "@/lib/db";

export async function verifyDashboardAccess(companyId: string) {
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const user = await whopsdk.users.retrieve(userId);

	const company = await whopsdk.companies.retrieve(companyId);
	const access = await whopsdk.users.checkAccess(companyId, { id: userId });

	if (!access.has_access) {
		throw new Error("Unauthorized");
	}

	return { userId, user, company };
}

export async function verifyExperienceAccess(experienceId: string) {
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

	if (!access.has_access) {
		throw new Error("Unauthorized");
	}

	return { userId };
}

export async function getInstallationTier(companyId: string) {
	const result = await query(
		"SELECT tier FROM installations WHERE whop_company_id = $1",
		[companyId],
	);
	return (result.rows[0]?.tier as string) || "free";
}
