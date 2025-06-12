'use server';
import { Fragment, ReactNode } from 'react';
import React from 'react';
import { Header } from '@/components/header';
import { getUser } from '@/services/auth';
import { Sidebar } from '@/components/sidebar';

export default async function RootLayout({ children }: { children: ReactNode }) {
	const user = await getUser();

	return (
		<Fragment>
			<div className="bg-red-500 w-full p-3 text-center text-white font-semibold">This is a rebirth of WP-Veritas. Only operations performed directly on sites will be executed. Tags changes made here will not be reflected in the actual WP-Veritas instance. </div>
			<Header user={user} />
			<main className="flex sm:h-[calc(100%-90px)]">
				<Sidebar user={user} />
				{children}
			</main>
		</Fragment>
	);
}
