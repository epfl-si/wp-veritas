"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TAG_CATEGORIES } from "@/constants/tags";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import Form, { FormConfig, FieldConfig, SectionConfig } from "@/components/form";
import { tagSchema, TagFormType, TagType, TagCategoryEnumType } from "@/types/tag";
import { useZodErrorMessages } from "@/hooks/zod";
import { cn } from "@/lib/utils";

interface TagUpdateProps {
  tag: TagType;
}

export const TagUpdate: React.FC<TagUpdateProps> = ({ tag }) => {
	const t = useTranslations("tag");
	const locale = useLocale();
	const errorMessages = useZodErrorMessages();
	const [activeTab, setActiveTab] = useState<"form" | "sites">("form");

	const sites = tag.sites || [];

	const getFormConfig = (): FormConfig<TagFormType> => {
		const fields: FieldConfig[] = [
			{
				name: "type",
				type: "boxes",
				label: t("form.type.label"),
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
				label: t("form.nameFr.label"),
				placeholder: t("form.nameFr.placeholder"),
				section: "names",
				width: "half",
			},
			{
				name: "nameEn",
				type: "text",
				label: t("form.nameEn.label"),
				placeholder: t("form.nameEn.placeholder"),
				section: "names",
				width: "half",
			},
			{
				name: "urlFr",
				type: "text",
				label: t("form.urlFr.label"),
				placeholder: t("form.urlFr.placeholder"),
				section: "names",
				width: "full",
			},
			{
				name: "urlEn",
				type: "text",
				label: t("form.urlEn.label"),
				placeholder: t("form.urlEn.placeholder"),
				section: "names",
				width: "full",
			},
		];

		const sections: SectionConfig[] = [
			{
				name: "general",
				title: t("form.sections.general.title"),
				columns: 1,
			},
			{
				name: "names",
				title: t("form.sections.names.title"),
				columns: 2,
			},
		];

		return {
			schema: tagSchema(errorMessages),
			fields,
			sections,
			defaultValues: {
				type: (tag.type || "faculty") as TagCategoryEnumType,
				nameFr: tag.nameFr || "",
				nameEn: tag.nameEn || "",
				urlFr: tag.urlFr || "",
				urlEn: tag.urlEn || "",
			},
			apiEndpoint: `/api/tags/${tag.id}`,
			method: "PUT",
			reset: false,
			submitButtonText: t("actions.update"),
			resetButtonText: t("actions.reset"),
			loadingText: t("actions.updating"),
			successTitle: t("update.success.title"),
			successMessage: t("update.success.message"),
			errorMessage: t("update.error.title"),
			onSuccess: () => {},
			onError: (error) => {
				console.error("Error updating tag:", error);
			},
		};
	};

	const getInfrastructureInfo = (infrastructure: string) => {
		const infraConfig = Object.values(INFRASTRUCTURES).find(
			infra => infra.NAME === infrastructure,
		);
		return infraConfig || INFRASTRUCTURES.EXTERNAL;
	};

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-0 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-3xl font-bold">{t("update.title")}</h1>
          
					<div className="flex bg-gray-100 rounded-lg p-1">
						<button
							onClick={() => setActiveTab("form")}
							className={cn(
								"px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
								activeTab === "form"
									? "bg-white text-gray-900 shadow-sm"
									: "text-gray-600 hover:text-gray-900",
							)}
						>
							{t("form.tabs.configuration")}
						</button>
						<button
							onClick={() => setActiveTab("sites")}
							className={cn(
								"px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2",
								activeTab === "sites"
									? "bg-white text-gray-900 shadow-sm"
									: "text-gray-600 hover:text-gray-900",
							)}
						>
							<span>{t("form.tabs.sites")}</span>
							<span className={cn(
								"inline-flex items-center justify-center w-5 h-5 rounded-full",
								activeTab === "sites"
									? "bg-blue-100 text-blue-600"
									: "bg-gray-200 text-gray-600",
								sites.length >= 100 ? "text-[0.6rem] pt-0.5" : "text-xs",
							)}>
								{sites.length}
							</span>
						</button>
					</div>
				</div>
			</div>

			<div className="px-6 pb-6 h-full overflow-y-auto">
				{activeTab === "form" && <Form config={getFormConfig()} />}
        
				{activeTab === "sites" && (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold text-gray-900">
									{t("sites.title")}
								</h2>
								<p className="text-sm text-gray-500 mt-1">
									{t("sites.count", { count: sites.length })}
								</p>
							</div>
						</div>

						{sites.length > 0 ? (
							<div className="bg-white overflow-hidden">
								<ul className="divide-y divide-gray-200">
									{sites.map((site) => {
										const infraInfo = getInfrastructureInfo(site.infrastructure);
										const IconComponent = infraInfo.ICON;
                    
										return (
											<li key={site.id}>
												<div className="px-4 py-4 hover:bg-gray-50">
													<div className="flex items-center space-x-4">
														<div 
															className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
															style={{ backgroundColor: `${infraInfo.COLOR}20` }}
														>
															<IconComponent 
																className="w-5 h-5" 
																style={{ color: infraInfo.COLOR }}
															/>
														</div>
                            
														<div className="flex-1 min-w-0">
															<a
																href={site.url}
																target="_blank"
																rel="noopener noreferrer"
																className="text-base font-medium text-blue-600 hover:text-blue-500 break-all"
															>
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
								<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
								</svg>
								<h3 className="mt-2 text-sm font-medium text-gray-900">{t("sites.empty.title")}</h3>
								<p className="mt-1 text-sm text-gray-500">
									{t("sites.empty.description")}
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
