"use server";
import { Fragment, type ReactNode } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { getUser } from "@/services/auth";

export default async function RootLayout({ children }: { children: ReactNode }) {
	const user = await getUser();

	return (
		<Fragment>
			<Header user={user} />
			<main className="flex sm:h-[calc(100%-90px)]">
				<Sidebar user={user} />
				{children}
			</main>
		</Fragment>
	);
}
