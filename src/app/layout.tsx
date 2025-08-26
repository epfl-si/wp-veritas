import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
export const dynamic = "force-dynamic";
import { SessionProvider } from "@/components/session-provider";
import { auth } from "@/services/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "WP-Veritas",
	description: "WP-Veritas is a web application for managing wordpress site at EPFL.",
	icons: {
		icon: [
			{
				url: "https://epfl-si.github.io/elements/svg/epfl-logo.svg",
			},
		],
	},
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();
	const messages = await getMessages();

	const session = await auth();

	return (
		<html lang={locale} className="h-full">
			<header>
				<script defer src={process.env.UMAMI_URL_SCRIPT} data-website-id={process.env.UMAMI_WEBSITE_ID}></script>
			</header>
			<body className={cn("antialiased h-full flex flex-col", inter.className)}>
				<NextIntlClientProvider messages={messages}>
					<SessionProvider session={session}>{children}</SessionProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
