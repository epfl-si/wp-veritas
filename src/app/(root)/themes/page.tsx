"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { THEMES } from "@/constants/theme";
import type { ThemeType } from "@/types/theme";

export default function ThemeListPage() {
	const t = useTranslations("theme");
	const locale = useLocale() as "fr" | "en";
	const router = useRouter();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();
	const name = searchParams.get("name") || "";

	const themes = Object.values(THEMES).filter((theme: ThemeType) => {
		const matchesName = theme.NAME.toLowerCase().includes(name.toLowerCase());
		const matchesLabel = theme.LABEL[locale]?.toLowerCase().includes(name.toLowerCase());
		return matchesName || matchesLabel;
	});

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 shrink-0 mt-1">
				<div className="flex items-center justify-between h-10">
					<h1 className="text-3xl font-bold">{t("list.title")}</h1>
				</div>
				<div className="flex gap-2 mt-6">
					<Input
						defaultValue={name}
						onChange={(e) => {
							startTransition(() => {
								const params = new URLSearchParams(searchParams);
								if (e.target.value) params.set("name", e.target.value);
								else params.delete("name");
								router.push(`?${params.toString()}`);
							});
						}}
						placeholder={t("list.search.name.placeholder")}
						className="flex-1 h-10"
					/>
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">
				<div className="rounded-md border">
					{themes.map((theme, i) => (
						<div key={theme.NAME} className={`px-4 py-3 text-base font-medium${i < themes.length - 1 ? " border-b" : ""}`}>
							{theme.LABEL[locale] || theme.NAME}
						</div>
					))}
					{themes.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t("list.empty")}</div>}
				</div>
			</div>
		</div>
	);
}
