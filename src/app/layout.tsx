import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
export const dynamic = "force-dynamic";
import { SessionProvider } from "@/components/session-provider";
import { auth } from "@/services/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const suisse = localFont({
    src: [
        {
            path: "../../fonts/SuisseIntl-Regular-WebS.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../fonts/SuisseIntl-SemiBold-WebS.woff2",
            weight: "600",
            style: "normal",
        },
    ],
    variable: "--font-suisse",
});


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
		<html lang={locale} className={cn("h-full", inter.variable, suisse.variable)}>
			<head>
				<script defer src={process.env.UMAMI_URL_SCRIPT} data-website-id={process.env.UMAMI_WEBSITE_ID}></script>
			</head>
			<body className={cn("antialiased h-full flex flex-col font-sans")}>
				<NextIntlClientProvider messages={messages}>
					<SessionProvider session={session}>{children}</SessionProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
