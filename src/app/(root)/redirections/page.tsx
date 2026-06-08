"use client";
import { Construction, LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export default function RedirectionsPage() {
	const translations = {
		navigation: useTranslations("navigation"),
		redirections: useTranslations("redirections"),
	};

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 shrink-0 mt-1">
				<h1 className="text-3xl font-bold">{translations.navigation("redirections")}</h1>
			</div>
			<div className="flex-1 flex items-center justify-center pb-16">
				<div className="flex flex-col items-center gap-6 text-center max-w-md">
					<div className="relative">
						<LinkIcon className="size-16 text-gray-200" />
						<Construction className="size-7 text-amber-400 absolute -bottom-1 -right-2" />
					</div>
					<div className="space-y-2">
						<h2 className="text-xl font-semibold text-gray-800">{translations.redirections("wip.title")}</h2>
						<p className="text-sm text-gray-500">{translations.redirections("wip.description")}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
