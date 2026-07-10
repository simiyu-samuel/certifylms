import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
	variable: "--font-fraunces",
	subsets: ["latin"],
	weight: ["400", "600", "700"],
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
	variable: "--font-ibm-plex-mono",
	subsets: ["latin"],
	weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
	title: "CertifyLMS",
	description:
		"The quiz, gradebook, and certification layer for Whop — turning any course-selling whop into a real accredited learning program.",
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable} antialiased`}
				style={{ fontFamily: "var(--font-inter)" }}
			>
				<WhopApp>{children}</WhopApp>
			</body>
		</html>
	);
}
