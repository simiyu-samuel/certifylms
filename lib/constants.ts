export const BRAND = {
	ink: "#14152B",
	ink60: "#4A4B63",
	ink30: "#C7C8D6",
	chalk: "#F3F4F8",
	sealGold: "#C79A3B",
	goldDim: "#8A6B28",
	verifiedGreen: "#2F9E68",
	brick: "#B5533F",
} as const;

export const TIER_LIMITS = {
	free: { maxCourses: 1, maxQuizzes: 3 },
	pro: { maxCourses: Infinity, maxQuizzes: Infinity },
	pro_plus: { maxCourses: Infinity, maxQuizzes: Infinity },
} as const;
