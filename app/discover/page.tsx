export default function DiscoverPage() {
	return (
		<div className="min-h-screen" style={{ backgroundColor: "var(--brand-chalk)" }}>
			<div className="max-w-4xl mx-auto px-4 py-16">
				<div className="text-center mb-12">
					<h1
						className="text-5xl font-bold mb-4"
						style={{ fontFamily: "var(--font-fraunces)", color: "var(--brand-ink)" }}
					>
						CertifyLMS
					</h1>
					<p
						className="text-xl"
						style={{ color: "var(--brand-ink-60)", fontFamily: "var(--font-inter)" }}
					>
						The quiz, gradebook, and certification layer for Whop
					</p>
				</div>

				<div
					className="rounded-xl p-8 text-center mb-16 border"
					style={{
						backgroundColor: "white",
						borderColor: "var(--brand-ink-30)",
					}}
				>
					<p className="text-lg mb-4" style={{ color: "var(--brand-ink)" }}>
						Turn any course-selling whop into a real accredited learning program.
					</p>
					<p className="text-base" style={{ color: "var(--brand-ink-60)" }}>
						Quiz builder &bull; Gradebook &bull; Certificates &bull; Progress tracking &bull; Drip gating
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-6 mb-10">
					{[
						{
							title: "Quiz Builder",
							desc: "Multiple question types, pass thresholds, attempt limits, and randomized ordering.",
						},
						{
							title: "Gradebook",
							desc: "Per-student and per-quiz analytics with CSV export and manual-grading support.",
						},
						{
							title: "Certificates",
							desc: "Auto-issued PDFs with unique verification codes and a public verification page.",
						},
					].map((feature) => (
						<div
							key={feature.title}
							className="rounded-xl p-6 flex flex-col gap-2 border"
							style={{
								backgroundColor: "white",
								borderColor: "var(--brand-ink-30)",
							}}
						>
							<h3
								className="text-lg font-semibold"
								style={{
									fontFamily: "var(--font-fraunces)",
									color: "var(--brand-seal-gold)",
								}}
							>
								{feature.title}
							</h3>
							<p className="text-sm" style={{ color: "var(--brand-ink-60)" }}>
								{feature.desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
