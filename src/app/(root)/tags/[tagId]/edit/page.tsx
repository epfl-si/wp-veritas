"use client";
import { CheckSquare, Frown, Square, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useEffect, useState } from "react";
import { DeleteDialog } from "@/components/dialog/delete";
import { Form } from "@/components/form";
import { Button } from "@/components/ui/button";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { TAG_CATEGORIES } from "@/constants/tags";
import { useZodErrorMessages } from "@/hooks/zod";
import { cn } from "@/lib/utils";
import { disassociateTagFromSite, getTag, updateTagAction } from "@/services/tag";
import type { FieldConfig, FormConfig, SectionConfig } from "@/types/form";
import type { ServiceResponse } from "@/types/response";
import { type TagCategoryEnumType, type TagFormType, type TagType, tagSchema } from "@/types/tag";

export default function TagUpdatePage() {
	const params = useParams();
	const tagId = params.tagId as string;
	const translations = {
		tag: useTranslations("tag"),
		actions: useTranslations("actions"),
	};
	const locale = useLocale();
	const errorMessages = useZodErrorMessages();
	const [tag, setTag] = useState<TagType | null>(null);
	const [activeTab, setActiveTab] = useState<"form" | "sites">("form");
	const [selectedSites, setSelectedSites] = useState<string[]>([]);
	const [isRemoving, setIsRemoving] = useState(false);

	useEffect(() => {
		getTag(tagId).then(({ tag: data }) => {
			if (data) setTag(data);
		});
	}, [tagId]);

	const sites = tag?.sites || [];

	const getFormConfig = (): FormConfig<TagFormType> => {
		const fields: FieldConfig[] = [
			{
				name: "type",
				type: "boxes",
				label: translations.tag("form.type.label"),
				section: "general",
				width: "full",
				options: Object.values(TAG_CATEGORIES).map((type) => ({
					value: type.NAME,
					label: type.LABEL[locale as "fr" | "en"] || type.NAME,
					color: type.COLOR,
					icon: type.ICON,
				})),
			},
			{
				name: "nameFr",
				type: "text",
				label: translations.tag("form.nameFr.label"),
				placeholder: translations.tag("form.nameFr.placeholder"),
				section: "names",
				width: "half",
			},
			{
				name: "nameEn",
				type: "text",
				label: translations.tag("form.nameEn.label"),
				placeholder: translations.tag("form.nameEn.placeholder"),
				section: "names",
				width: "half",
			},
			{
				name: "urlFr",
				type: "text",
				label: translations.tag("form.urlFr.label"),
				placeholder: translations.tag("form.urlFr.placeholder"),
				section: "names",
				width: "full",
			},
			{
				name: "urlEn",
				type: "text",
				label: translations.tag("form.urlEn.label"),
				placeholder: translations.tag("form.urlEn.placeholder"),
				section: "names",
				width: "full",
			},
		];

		const sections: SectionConfig[] = [
			{ name: "general", title: translations.tag("form.sections.general.title"), columns: 1 },
			{ name: "names", title: translations.tag("form.sections.names.title"), columns: 2 },
		];

		return {
			schema: tagSchema(errorMessages),
			fields,
			sections,
			defaultValues: {
				type: (tag?.type || "faculty") as TagCategoryEnumType,
				nameFr: tag?.nameFr || "",
				nameEn: tag?.nameEn || "",
				urlFr: tag?.urlFr || "",
				urlEn: tag?.urlEn || "",
			},
			serverAction: updateTagAction.bind(null, tagId) as (data: TagFormType) => Promise<ServiceResponse<unknown>>,
			reset: false,
			submitButtonText: translations.tag("update.label"),
			resetButtonText: translations.tag("reset"),
			loadingText: translations.actions("updating"),
			successTitle: translations.tag("update.success"),
			successMessage: translations.tag("update.successMessage"),
			errorMessage: translations.tag("update.error"),
			onSuccess: () => {},
			onError: (error) => console.error("Error updating tag:", error),
		};
	};

	const getInfrastructureInfo = (infrastructure: string) => {
		const infraConfig = Object.values(INFRASTRUCTURES).find((infra) => infra.NAME === infrastructure);
		return infraConfig || INFRASTRUCTURES.EXTERNAL;
	};

	const handleSelectSite = (siteId: string) => {
		setSelectedSites((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]));
	};

	const handleSelectAll = () => {
		setSelectedSites(selectedSites.length === sites.length ? [] : sites.map((site) => site.id));
	};

	const removeSiteFromTag = async (siteId: string) => {
		const { error } = await disassociateTagFromSite(tagId, siteId);
		if (error) throw new Error("Failed to remove site from tag");
	};

	const handleRemoveSelected = async () => {
		if (selectedSites.length === 0) return;
		setIsRemoving(true);
		try {
			await Promise.all(selectedSites.map((siteId) => removeSiteFromTag(siteId)));
			window.location.reload();
		} catch (error) {
			console.error("Error removing sites:", error);
			throw error;
		} finally {
			setIsRemoving(false);
		}
	};

	const handleRemoveAll = async () => {
		if (sites.length === 0) return;
		setIsRemoving(true);
		try {
			await Promise.all(sites.map((site) => removeSiteFromTag(site.id)));
			window.location.reload();
		} catch (error) {
			console.error("Error removing all sites:", error);
			throw error;
		} finally {
			setIsRemoving(false);
		}
	};

	return (
		<Fragment>
			<div className="p-6 pb-0 shrink-0 mt-1">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-3xl font-bold">{translations.tag("update.title")}</h1>
					<div className="flex bg-gray-100 rounded-lg p-1">
						<button
							type="button"
							onClick={() => setActiveTab("form")}
							className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all duration-200", activeTab === "form" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
						>
							{translations.tag("form.configTab")}
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("sites")}
							className={cn(
								"px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2",
								activeTab === "sites" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
							)}
						>
							<span>{translations.tag("form.sitesTab")}</span>
							<span
								className={cn(
									"inline-flex items-center justify-center w-5 h-5 rounded-full",
									activeTab === "sites" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600",
									sites.length >= 100 ? "text-[0.6rem] pt-0.5" : "text-xs",
								)}
							>
								{sites.length}
							</span>
						</button>
					</div>
				</div>
			</div>
			<div className="px-6 pb-6 h-full overflow-y-auto">
				{activeTab === "form" && tag && <Form config={getFormConfig()} />}
				{activeTab === "sites" && (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold text-gray-900">{translations.tag("sites.title")}</h2>
								<p className="text-sm text-gray-500 mt-1">{translations.tag("sites.count", { count: sites.length })}</p>
							</div>
							{sites.length > 0 && (
								<div className="flex space-x-2">
									<Button onClick={handleSelectAll} disabled={isRemoving} variant="outline">
										{selectedSites.length === sites.length ? translations.tag("sites.deselectAll") : translations.tag("sites.selectAll")}
									</Button>
									{selectedSites.length > 0 && (
										<DeleteDialog
											displayName={`${selectedSites.length} sites`}
											type="site"
											icon={Trash2}
											onBulkDelete={handleRemoveSelected}
											itemCount={selectedSites.length}
											triggerText={isRemoving ? translations.tag("sites.removing") : translations.tag("sites.removeSelected", { count: selectedSites.length })}
											isPlural={true}
										/>
									)}
									<DeleteDialog
										displayName={`${sites.length} sites`}
										type="site"
										icon={Trash2}
										onBulkDelete={handleRemoveAll}
										itemCount={sites.length}
										triggerText={isRemoving ? translations.tag("sites.removing") : translations.tag("sites.removeAll")}
										isPlural={true}
									/>
								</div>
							)}
						</div>
						{sites.length > 0 ? (
							<div className="bg-white overflow-hidden">
								<ul className="divide-y divide-gray-200">
									{sites.map((site) => {
										const infraInfo = getInfrastructureInfo(site.infrastructure);
										const IconComponent = infraInfo.ICON;
										const isSelected = selectedSites.includes(site.id);
										return (
											<li key={site.id}>
												<div className="px-4 py-4 hover:bg-gray-50">
													<div className="flex items-center space-x-4">
														<button type="button" onClick={() => handleSelectSite(site.id)} disabled={isRemoving} className="shrink-0 p-1 disabled:opacity-50 disabled:cursor-not-allowed">
															{isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />}
														</button>
														<div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${infraInfo.COLOR}20` }}>
															<IconComponent className="w-5 h-5" style={{ color: infraInfo.COLOR }} />
														</div>
														<div className="flex-1 min-w-0">
															<a href={site.url} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-600 hover:text-blue-500 break-all">
																{site.url}
															</a>
														</div>
													</div>
												</div>
											</li>
										);
									})}
								</ul>
							</div>
						) : (
							<div className="text-center py-12">
								<Frown className="mx-auto mb-4 size-12 text-gray-400" />
								<h3 className="mt-2 text-sm font-medium text-gray-900">{translations.tag("sites.empty.title")}</h3>
								<p className="mt-1 text-sm text-gray-500">{translations.tag("sites.empty.description")}</p>
							</div>
						)}
					</div>
				)}
			</div>
		</Fragment>
	);
}
