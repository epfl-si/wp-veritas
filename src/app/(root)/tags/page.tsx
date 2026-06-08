"use client";
import { Pencil, TagIcon, Trash2 } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, type TableColumn } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAbility } from "@/hooks/useAbility";
import "moment/locale/fr";
import { Plus } from "lucide-react";
import { DeleteDialog } from "@/components/dialog/delete";
import { TAG_CATEGORIES } from "@/constants/tags";
import { deleteTagAction, listTags } from "@/services/tag";
import type { TagCategoryType, TagsType } from "@/types/tag";

export default function TagListPage() {
	const ability = useAbility();
	const [tags, setTags] = useState<TagsType[]>([]);
	const [search, setSearch] = useState({ name: "", type: "" });
	const translations = {
		list: useTranslations("pages.tagList"),
		tag: useTranslations("tag"),
	};
	const locale = useLocale();

	useEffect(() => {
		moment.locale(locale);
	}, [locale]);

	useEffect(() => {
		listTags().then(({ tags: data }) => {
			if (data) setTags(data);
		});
	}, []);

	const getTypeConfig = (typeName: string) => {
		return Object.values(TAG_CATEGORIES).find((type) => type.NAME === typeName);
	};

	const filteredTags = tags.filter((tag) => {
		const matchesName = tag.nameFr.toLowerCase().includes(search.name.toLowerCase()) || tag.nameEn.toLowerCase().includes(search.name.toLowerCase());
		const matchesType = search.type === "" || tag.type === search.type;
		return matchesName && matchesType;
	});

	const columns: TableColumn<TagsType>[] = [
		{
			key: "nameEn",
			label: "Nom (EN)",
			width: "w-[30%]",
			align: "left",
			sortable: true,
			render: (tag) => (
				<div className="text-base font-medium leading-relaxed" title={tag.nameEn}>
					{tag.nameEn}
				</div>
			),
		},
		{
			key: "nameFr",
			label: "Nom (FR)",
			width: "w-[30%]",
			align: "left",
			sortable: true,
			render: (tag) => (
				<div className="flex items-center gap-2">
					<div className="text-base font-medium leading-relaxed" title={tag.nameFr}>
						{tag.nameFr}
					</div>
				</div>
			),
		},
		{
			key: "type",
			label: "Type",
			width: "w-[15%]",
			align: "left",
			sortable: true,
			render: (tag) => {
				const typeConfig = getTypeConfig(tag.type);
				return (
					<div className="flex items-center gap-2" title={typeConfig?.LABEL[locale as "fr" | "en"] || tag.type}>
						{typeConfig?.LABEL[locale as "fr" | "en"] || tag.type}
					</div>
				);
			},
		},
		{
			key: "actions",
			label: "Actions",
			width: "w-[10%]",
			align: "left",
			sortable: false,
			render: (tag) => {
				const canDelete = ability.can("delete", "Tag") && tag.sites.length === 0;
				const hasAssociatedSites = tag.sites.length > 0;
				return (
					<div className="flex gap-1.5 items-center py-1">
						{ability.can("update", "Tag") && (
							<Button variant="outline" className="p-1 w-9 h-9 border-2 border-blue-400 text-blue-600 hover:text-blue-600 hover:bg-blue-100" asChild>
								<Link href={`/tags/${tag.id}/edit`}>
									<Pencil strokeWidth={2.3} className="size-5" />
								</Link>
							</Button>
						)}
						{ability.can("delete", "Tag") &&
							(canDelete ? (
								<DeleteDialog icon={TagIcon} displayName={locale === "fr" ? tag.nameFr : tag.nameEn} type="tag" onDelete={() => deleteTagAction(tag.id)} />
							) : hasAssociatedSites ? (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="p-1 w-9 h-9 border-2 border-gray-200 text-gray-600 opacity-70 rounded-md flex items-center justify-center cursor-not-allowed">
												<Trash2 strokeWidth={2.3} className="size-5" />
											</div>
										</TooltipTrigger>
										<TooltipContent>
											<p className="text-sm">{translations.tag("deleteTooltip", { count: tag.sites.length })}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							) : null)}
					</div>
				);
			},
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-0 shrink-0 mt-1">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">{translations.list("title")}</h1>
					{ability.can("create", "Tag") && (
						<Button className="h-10" asChild>
							<Link href="/tags/add">
								<Plus className="size-5" />
								{translations.tag("add")}
							</Link>
						</Button>
					)}
				</div>
			</div>
			<div className="px-6 pb-4 shrink-0">
				<div className="flex gap-2 mt-6">
					<Input onChange={(e) => setSearch({ ...search, name: e.target.value })} value={search.name} placeholder={translations.list("search.placeholder")} className="flex-1 h-10" />
					<Select onValueChange={(value) => setSearch({ ...search, type: value === "all" ? "" : value })} value={search.type || "all"}>
						<SelectTrigger className="w-48 h-10!">
							<SelectValue placeholder={translations.list("filter.type.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{translations.list("filter.type.all")}</SelectItem>
							{Object.values(TAG_CATEGORIES).map((type: TagCategoryType) => (
								<SelectItem key={type.NAME} value={type.NAME}>
									{type?.LABEL[locale as "fr" | "en"] || type.NAME}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">
				<Table data={filteredTags} columns={columns} />
			</div>
		</div>
	);
}
