"use client";
import { BadgeInfo, Bookmark, Bot, CirclePlus, GalleryVerticalEnd, House, LinkIcon, Palette, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "next-auth";
import { useTranslations } from "next-intl";
import { defineAbilityFor } from "@/lib/ability";
import { cn } from "@/lib/utils";
import pjson from "../../package.json";

export const Sidebar: React.FC<{ user: User }> = ({ user }) => {
	const pathname = usePathname();
	const translations = {
		navigation: useTranslations("navigation"),
	};

	const ability = defineAbilityFor(user.groups ?? []);

	const navItems = [
		{
			href: "/",
			label: translations.navigation("home"),
			icon: House,
			show: ability.can("list", "Site"),
		},
		{
			href: "/new",
			label: translations.navigation("new"),
			icon: CirclePlus,
			show: ability.can("create", "Site"),
		},
		{
			href: "/search",
			label: translations.navigation("info"),
			icon: BadgeInfo,
			show: ability.can("search", "Site"),
		},
		{
			href: "/tags",
			label: translations.navigation("tags"),
			icon: Bookmark,
			show: ability.can("list", "Tag"),
		},
		{
			href: "/themes",
			label: translations.navigation("themes"),
			icon: Palette,
			show: ability.can("list", "Theme"),
		},
		{
			href: "/api-docs",
			label: translations.navigation("apiDocs"),
			icon: Bot,
			show: ability.can("list", "Site"),
		},
		{
			href: "/users",
			label: translations.navigation("users"),
			icon: Users,
			show: ability.can("list", "User"),
		},
		{
			href: "/redirections",
			label: translations.navigation("redirections"),
			icon: LinkIcon,
			show: ability.can("list", "Redirection"),
		},
		{
			href: "/logs",
			label: translations.navigation("logs"),
			icon: GalleryVerticalEnd,
			show: ability.can("list", "Log"),
		},
	].filter((item) => item.show);

	return (
		<aside className="max-w-72 flex-1 space-y-2 border-r p-4 flex flex-col justify-between">
			<nav className="space-y-2 w-full">
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						prefetch={true}
						className={cn("px-6 py-3 rounded-lg flex text-primary-secondary font-medium w-full items-center justify-start gap-2", pathname === item.href ? "text-primary" : "hover:bg-muted/80")}
					>
						<item.icon className="w-5 h-5" />
						{item.label}
					</Link>
				))}
			</nav>
			<p className="text-xs text-center text-gray-500/70 mt-4">
				<a href="https://go.epfl.ch/fsd">ISAS-FSD</a>&nbsp;&mdash;&nbsp;
				<a href="https://github.com/epfl-si/wp-veritas">{pjson.version}</a>
			</p>
		</aside>
	);
};
