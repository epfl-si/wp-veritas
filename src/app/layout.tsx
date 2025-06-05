import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
export const dynamic = 'force-dynamic';
import { SessionProvider } from '@/components/session-provider';
import { Session } from 'next-auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'WP-Veritas',
	description: 'WP-Veritas is a web application for managing wordpress site at EPFL.',
	icons: {
		icon: [
			{
				url: 'https://epfl-si.github.io/elements/svg/epfl-logo.svg',
			},
		],
	},
};

export default async function RootLayout({ children, session }: Readonly<{ children: React.ReactNode; session: Session }>) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} className="h-full">
			<body className={cn('antialiased h-full flex flex-col', inter.className)}>
				<NextIntlClientProvider messages={messages}>
					<SessionProvider session={session}>{children}</SessionProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
