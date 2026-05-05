"use client";
import { Paintbrush } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Table, type TableColumn } from "@/components/ui/table";
import { THEMES } from "@/constants/theme";
import type { ThemeType } from "@/types/theme";

export default function ThemeListPage() {
	const locale = useLocale() as "fr" | "en";
	const router = useRouter();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();
	const name = searchParams.get("name") || "";

	const translations = {
		themeList: useTranslations("pages.themeList"),
	};

	const themes = Object.values(THEMES).filter((theme: ThemeType) => {
		const matchesName = theme.NAME.toLowerCase().includes(name.toLowerCase());
		const matchesLabel = theme.LABEL[locale]?.toLowerCase().includes(name.toLowerCase());
		return matchesName || matchesLabel;
	});

	const columns: TableColumn<ThemeType>[] = [
		{
			key: "LABEL",
			label: translations.themeList("column.label"),
			width: "w-[60%]",
			align: "left",
			sortable: false,
			render: (theme) => <span className="text-base font-medium">{theme.LABEL[locale] || theme.NAME}</span>,
		},
		{
			key: "NAME",
			label: translations.themeList("column.name"),
			width: "w-[40%]",
			align: "left",
			sortable: true,
			render: (theme) => <span className="text-sm text-gray-600 font-mono">{theme.NAME}</span>,
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 shrink-0 mt-1">
				<div className="flex items-center justify-between h-10">
					<h1 className="text-3xl font-bold">{translations.themeList("title")}</h1>
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
						placeholder={translations.themeList("search.placeholder")}
						className="flex-1 h-10"
					/>
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">
				{themes.length === 0 ? (
					<div className="rounded-md flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
						<Paintbrush className="size-10 opacity-30" />
						<p className="text-sm">{translations.themeList("empty")}</p>
					</div>
				) : (
					<Table data={themes} columns={columns} defaultSort={{ key: "NAME", direction: "asc" }} />
				)}
			</div>
		</div>
	);
}
