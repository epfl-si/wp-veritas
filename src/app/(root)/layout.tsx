"use server";
import { Fragment, ReactNode } from "react";
import React from "react";
import { Header } from "@/components/header";
import { getUser } from "@/services/auth";
import { Sidebar } from "@/components/sidebar";

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
