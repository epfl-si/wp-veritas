"use client";
import React from "react";
import { LanguageSelector } from "@/components/language-selector";
import { User } from "next-auth";
import { UserRound } from "lucide-react";
import Image from "next/image";

export const Header: React.FC<{ user: User }> = ({ user }) => {
	return (
		<header className="text-primary-secondary py-2 px-2 sm:py-4 sm:px-6 flex items-center justify-between border-b-2 border-0 select-none">
			<div className="flex items-center gap-2 sm:gap-4 p-1 sm:p-3">
				<Image src="https://epfl-si.github.io/elements/svg/epfl-logo.svg" alt="EPFL" width={97} height={28} className="h-4 sm:h-7" />
				<span className="border-l-2 border-solid sm:h-6 h-4 w-1 border-gray-300"></span>
				<h1 className="text-base sm:text-2xl font-bold -ml-1 sm:ml-0">WP-Veritas</h1>
			</div>
			<div className="flex items-center gap-2 sm:gap-8">
				<div className="flex items-center gap-1.5">
					<UserRound />
					<p className="text-primary-secondary text-sm sm:text-base font-medium">{user.name}</p>
				</div>
				<LanguageSelector />
			</div>
		</header>
	);
};
