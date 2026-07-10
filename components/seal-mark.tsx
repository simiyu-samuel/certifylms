export function SealMark({ size = 32 }: { size?: number }) {
	const strokeWidth = Math.round(size * 0.018);
	const innerR = Math.round(size * 0.295);
	const checkStroke = Math.round(size * 0.038);

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 1024 1024"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Reeded edge lines - every 7.5 degrees */}
			{Array.from({ length: 48 }).map((_, i) => {
				const angle = (i * 2 * Math.PI) / 48;
				const r1 = 343;
				const r2 = 302;
				const cos = Math.cos(angle);
				const sin = Math.sin(angle);
				return (
					<line
						key={i}
						x1={512 + r1 * cos}
						y1={512 + r1 * sin}
						x2={512 + r2 * cos}
						y2={512 + r2 * sin}
						stroke="#C79A3B"
						strokeWidth={strokeWidth}
						strokeLinecap="round"
					/>
				);
			})}
			<circle
				cx={512}
				cy={512}
				r={301.88}
				fill="none"
				stroke="#C79A3B"
				strokeWidth={innerR * 0.025}
			/>
			<g transform="translate(512,512) rotate(-4)">
				<path
					d="M -87.54 0.00 L -19.90 71.63 L 103.46 -67.65"
					fill="none"
					stroke="#C79A3B"
					strokeWidth={checkStroke}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</g>
		</svg>
	);
}
