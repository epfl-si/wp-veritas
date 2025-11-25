"use client";
import React from "react";
import { useLocale, useTranslations } from "next-intl";
import Form, { FormConfig, FieldConfig, SectionConfig } from "@/components/form";
import { isKubernetesSite, SiteFormType, siteSchema, SiteType } from "@/types/site";
import { useZodErrorMessages } from "@/hooks/zod";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { THEMES } from "@/constants/theme";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/constants/languages";
import { OPTIONAL_CATEGORIES } from "@/constants/categories";
import { decode } from "html-entities";

interface SiteUpdateProps {
	site: SiteType;
}

export const SiteUpdate: React.FC<SiteUpdateProps> = ({ site }) => {
	const t = useTranslations("site");
	const locale = useLocale();
	const errorMessages = useZodErrorMessages();

	const getFormConfig = (): FormConfig<SiteFormType> => {
		const fields: FieldConfig[] = [
			{
				name: "infrastructure",
				type: "boxes",
				label: t("form.infrastructure.label"),
				section: "general",
				width: "full",
				disabled: true,
				options: Object.values(INFRASTRUCTURES)
					.filter((infrastructures) => infrastructures.CREATED)
					.map((infrastructure) => ({
						value: infrastructure.NAME,
						label: infrastructure.LABEL[locale as "fr" | "en"] || infrastructure.NAME,
						color: infrastructure.COLOR,
						icon: infrastructure.ICON,
					})),
			},
			{
				name: "url",
				type: "url",
				label: t("form.url.label"),
				placeholder: t("form.url.placeholder"),
				section: "general",
				width: "full",
				disabled: true,
			},
			{
				name: "title",
				type: "text",
				label: t("form.title.label"),
				placeholder: t("form.title.placeholder"),
				section: "details",
				width: "half",
				disabled: false,
				conditions: [
					{
						field: "infrastructure",
						operator: "regex",
						value: "^(Kubernetes|External|LAMP|Archived)$",
						type: "display",
					},
				],
			},
			{
				name: "tagline",
				type: "text",
				label: t("form.tagline.label"),
				placeholder: t("form.tagline.placeholder"),
				section: "details",
				width: "half",
				disabled: false,
				conditions: [
					{
						field: "infrastructure",
						operator: "regex",
						value: "^(Kubernetes|External|LAMP|Archived)$",
						type: "display",
					},
				],
			},
			{
				name: "theme",
				type: "select",
				label: t("form.theme.label"),
				placeholder: t("form.theme.placeholder"),
				section: "details",
				options: Object.values(THEMES).map((theme) => ({
					value: theme.NAME,
					label: theme.LABEL[locale as "fr" | "en"] || theme.NAME,
				})),
				width: "full",
				disabled: true,
				conditions: [
					{
						field: "infrastructure",
						operator: "equals",
						value: "Kubernetes",
						type: "display",
					},
					{
						field: "url",
						operator: "regex",
						value: "^https?://(?!(?:inside|www|wpn-test)[.])([a-zA-Z0-9-]+[.])*[a-zA-Z0-9-]+[.]epfl[.]ch(/.*)?$",
						type: "default",
						defaultValue: "wp-theme-light",
					},
					{
						field: "url",
						operator: "regex",
						value: "^https?://(?!(?:inside|www|wpn-test)[.])([a-zA-Z0-9-]+[.])*[a-zA-Z0-9-]+[.]epfl[.]ch(/.*)?$",
						type: "disabled",
					},
				],
			},
			{
				name: "unitId",
				type: "number",
				label: t("form.unitId.label"),
				placeholder: t("form.unitId.placeholder"),
				section: "details",
				width: "half",
			},
			{
				name: "languages",
				type: "multiselect",
				label: t("form.languages.label"),
				section: "details",
				width: "half",
				options: Object.values(LANGUAGES).map((lang) => ({
					value: lang.locale,
					label: lang.common,
					default: DEFAULT_LANGUAGE.map((lang) => lang.locale).includes(lang.locale),
				})),
				conditions: [
					{
						field: "infrastructure",
						operator: "equals",
						value: "Kubernetes",
						type: "display",
					},
				],
			},
			{
				name: "categories",
				type: "multiselect",
				label: t("form.categories.label"),
				section: "details",
				width: "full",
				options: Object.values(OPTIONAL_CATEGORIES).map((category) => ({
					value: category.NAME,
					label: category.LABEL,
				})),
				conditions: [
					{
						field: "infrastructure",
						operator: "equals",
						value: "Kubernetes",
						type: "display",
					},
				],
			},
			{
				name: "downloadsProtectionScript",
				type: "checkbox",
				label: t("form.downloadsProtectionScript.label"),
				placeholder: t("form.downloadsProtectionScript.placeholder"),
				section: "advanced",
				width: "full",
				conditions: [
					{
						field: "infrastructure",
						operator: "equals",
						value: "Kubernetes",
						type: "display",
					},
				],
				disabled: true,
			},
			{
				name: "monitored",
				type: "checkbox",
				label: t("form.monitored.label"),
				placeholder: t("form.monitored.placeholder"),
				section: "advanced",
				width: "full",
				conditions: [
					{
						field: "infrastructure",
						operator: "equals",
						value: "Kubernetes",
						type: "display",
					},
				],
			},
			{
				name: "ticket",
				type: "text",
				label: t("form.ticket.label"),
				placeholder: t("form.ticket.placeholder"),
				section: "metadata",
				width: "half",
			},
			{
				name: "comment",
				type: "textarea",
				label: t("form.comment.label"),
				placeholder: t("form.comment.placeholder"),
				section: "metadata",
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
				name: "details",
				title: t("form.sections.details.title"),
				columns: 2,
				conditions: [
					{
						field: "infrastructure",
						operator: "regex",
						value: "^(Kubernetes|External|LAMP|Archived)$",
					},
				],
			},
			{
				name: "advanced",
				title: t("form.sections.advanced.title"),
				columns: 1,
				conditions: [
					{
						field: "infrastructure",
						operator: "equals",
						value: "Kubernetes",
					},
				],
			},
			{
				name: "metadata",
				title: t("form.sections.metadata.title"),
				columns: 2,
			},
		];

		return {
			schema: siteSchema(errorMessages),
			fields,
			sections,
			defaultValues: {
				infrastructure: site.infrastructure || "kubernetes",
				url: site.url || "",
				title: isKubernetesSite(site) ? decode(site.title) : (site.title ? decode(site.title) : ""),
				tagline: isKubernetesSite(site) ? decode(site.tagline) : (site.tagline ? decode(site.tagline) : ""),
				theme: (isKubernetesSite(site) && site.theme) || "",
				unitId: (isKubernetesSite(site) && site.unitId) || 0,
				languages: (isKubernetesSite(site) && site.languages) || [],
				categories: (isKubernetesSite(site) && site.categories) || [],
				downloadsProtectionScript: (isKubernetesSite(site) && site.downloadsProtectionScript) || false,
				ticket: site.ticket || undefined,
				comment: site.comment || undefined,
				monitored: site.monitored ?? false,
			},
			apiEndpoint: `/api/sites/${site.id}`,
			method: "PUT",
			reset: false,
			submitButtonText: t("actions.update"),
			resetButtonText: t("actions.reset"),
			loadingText: t("actions.updating"),
			successTitle: t("update.success.title"),
			successMessage: t("update.success.message"),
			errorMessage: t("update.error.title"),
			onSuccess: () => { },
			onError: (error) => {
				console.error("Error updating site:", error);
			},
		};
	};

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between h-10">
					<h1 className="text-3xl font-bold">{t("update.title")}</h1>
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">
				<Form config={getFormConfig()} />
			</div>
		</div>
	);
};
