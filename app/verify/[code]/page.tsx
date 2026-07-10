export default async function VerifyPage({
	params,
}: {
	params: Promise<{ code: string }>;
}) {
	const { code } = await params;

	// TODO M5: Look up certificate by verification_code in the database
	// and render valid/invalid status.
	// For now this is a placeholder that always shows "not found".

	return (
		<div
			className="min-h-screen flex flex-col items-center justify-center p-8"
			style={{ backgroundColor: "var(--brand-chalk)" }}
		>
			<div
				className="max-w-md w-full rounded-xl p-8 border text-center"
				style={{
					backgroundColor: "white",
					borderColor: "var(--brand-ink-30)",
				}}
			>
				<div
					className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
					style={{ backgroundColor: "var(--brand-seal-gold)" }}
				>
					<span className="text-white text-2xl font-bold">C</span>
				</div>

				<h1
					className="text-2xl font-bold mb-2"
					style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
				>
					Certificate Verification
				</h1>

				<p className="text-sm mb-6" style={{ color: "var(--brand-ink-60)" }}>
					This verification code doesn't match any certificate on record.
				</p>

				<p
					className="text-xs font-mono"
					style={{
						fontFamily: "var(--font-ibm-plex-mono)",
						color: "var(--brand-ink-30)",
					}}
				>
					Code: {code}
				</p>
			</div>

			<p className="text-xs mt-8" style={{ color: "var(--brand-ink-30)" }}>
				CertifyLMS &mdash; Verified credentials for Whop courses
			</p>
		</div>
	);
}
