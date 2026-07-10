import { Whop } from "@whop/sdk";

let _client: Whop | null = null;

export function getWhopClient(): Whop {
	if (!_client) {
		const appID = process.env.NEXT_PUBLIC_WHOP_APP_ID;
		const apiKey = process.env.WHOP_API_KEY;

		if (!appID || !apiKey) {
			throw new Error(
				"CertifyLMS: NEXT_PUBLIC_WHOP_APP_ID and WHOP_API_KEY must be set. " +
					"Copy .env.development to .env.development.local and fill in your values.",
			);
		}

		_client = new Whop({
			appID,
			apiKey,
			webhookKey: btoa(process.env.WHOP_WEBHOOK_SECRET || ""),
		});
	}
	return _client;
}

export const whopsdk = new Proxy({} as Whop, {
	get(_target, prop: keyof Whop) {
		return getWhopClient()[prop];
	},
});
