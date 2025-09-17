"use client";
import React, { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { UseFormReturn } from "react-hook-form";
import Form, { FormConfig, FieldConfig, SectionConfig, SelectOption } from "@/components/form";
import { SiteFormType, siteSchema, SiteType } from "@/types/site";
import { useZodErrorMessages } from "@/hooks/zod";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { THEMES } from "@/constants/theme";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/constants/languages";
import { OPTIONAL_CATEGORIES } from "@/constants/categories";
import { ENVIRONMENTS } from "@/constants/environments";
import { getAvailableEnvironments } from "@/services/backup";
import { decode } from "html-entities";
import { Eye, Edit } from "lucide-react";

export const SiteAdd: React.FC = () => {
	const t = useTranslations("site");
	const locale = useLocale();
	const errorMessages = useZodErrorMessages();
	const [backupSites, setBackupSites] = useState<SelectOption[]>([]);
	const [loadingBackupSites, setLoadingBackupSites] = useState(false);
	const [formRef, setFormRef] = useState<UseFormReturn<SiteFormType> | null>(null);
	const [availableEnvironments, setAvailableEnvironments] = useState<string[]>([]);

	const loadBackupSites = async (environment: string) => {
		setLoadingBackupSites(true);
		try {
			const response = await fetch(`/api/sites/backup?environment=${environment}`);
			if (response.ok) {
				const data = await response.json();
				const sites = data.items?.map((site: SiteType) => ({
					value: site.id,
					label: `${site.url}`,
				})) || [];
				setBackupSites(sites);
			} else {
				setBackupSites([]);
			}
		} catch (error) {
			console.error("Error loading backup sites:", error);
			setBackupSites([]);
		} finally {
			setLoadingBackupSites(false);
		}
	};

	useEffect(() => {
		const loadEnvironments = async () => {
			const environments = await getAvailableEnvironments();
			setAvailableEnvironments(environments);
			if (environments.length > 0) {
				loadBackupSites(environments[0]);
				if (formRef && environments[0] !== formRef.getValues("backupEnvironment")) {
					formRef.setValue("backupEnvironment", environments[0]);
				}
			}
		};
		loadEnvironments();
	}, [formRef]);

	const loadSiteDetails = async (siteId: string, environment: string) => {
		if (!formRef || !siteId) return;

		try {
			const response = await fetch(`/api/sites/backup?environment=${environment}`);
			if (response.ok) {
				const data = await response.json();
				const selectedSite = data.items?.find((site: SiteType) => site.id === siteId);
				if (selectedSite) {
					formRef.setValue("title", decode(selectedSite.title) || "");
					formRef.setValue("tagline", decode(selectedSite.tagline) || "");
					formRef.setValue("theme", selectedSite.theme || "wp-theme-2018");
					formRef.setValue("unitId", selectedSite.unitId || 0);
					formRef.setValue("languages", selectedSite.languages || []);
					formRef.setValue("categories", selectedSite.categories || []);
				}
			}
		} catch (error) {
			console.error("Error loading site details:", error);
		}
	};

	const getFormConfig = (): FormConfig<SiteFormType> => {
		const fields: FieldConfig[] = [
			{
				name: "infrastructure",
				type: "boxes",
				label: t("form.infrastructure.label"),
				section: "general",
				width: "full",
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
				type: "text",
				label: t("form.url.label"),
				placeholder: t("form.url.placeholder"),
				section: "general",
				width: "full",
			},
			{
				name: "title",
				type: "text",
				label: t("form.title.label"),
				placeholder: t("form.title.placeholder"),
				section: "details",
				width: "half",
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
				name: "tagline",
				type: "text",
				label: t("form.tagline.label"),
				placeholder: t("form.tagline.placeholder"),
				section: "details",
				width: "half",
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
					{
						field: "url",
						operator: "regex",
						value: "^https?://www[.]epfl[.]ch(/.*)?$",
						type: "default",
						defaultValue: ["epfl-menus"],
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
					{
						field: "url",
						operator: "regex",
						value: "^https?://inside[.]epfl[.]ch(/.*)?$",
						type: "default",
						defaultValue: true,
					},
					{
						field: "url",
						operator: "regex",
						value: "^https?://inside[.]epfl[.]ch(/.*)?$",
						type: "disabled",
					},
				],
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
			...(availableEnvironments.length >= 1 ? [{
				name: "createFromBackup" as const,
				type: "checkbox" as const,
				label: `${t("form.createFromBackup.label")}`,
				placeholder: t("form.createFromBackup.placeholder"),
				section: "advanced" as const,
				width: "full" as const,
				disabled: false,
				conditions: [
					{
						field: "infrastructure",
						operator: "equals" as const,
						value: "Kubernetes",
						type: "display" as const,
					},
				],
			}] : []),
			...(availableEnvironments.length > 1 ? [{
				name: "backupEnvironment" as const,
				type: "select" as const,
				label: t("form.backupEnvironment.label"),
				placeholder: t("form.backupEnvironment.placeholder"),
				section: "advanced" as const,
				width: "full" as const,
				options: availableEnvironments.map((env) => {
					const envConfig = ENVIRONMENTS.find(e => e.name === env);
					return {
						value: env,
						label: envConfig?.displayName || env,
					};
				}),
				conditions: [
					{
						field: "infrastructure",
						operator: "equals" as const,
						value: "Kubernetes",
						type: "display" as const,
					},
					{
						field: "createFromBackup",
						operator: "equals" as const,
						value: true,
						type: "display" as const,
					},
				],
			}] : []),
			{
				name: "backupSite",
				type: "search",
				label: t("form.backupSite.label"),
				placeholder: loadingBackupSites ? "Loading..." : t("form.backupSite.placeholder"),
				section: "advanced",
				width: "full",
				options: backupSites,
				disabled: loadingBackupSites,
				conditions: [
					{
						field: "infrastructure",
						operator: "equals",
						value: "Kubernetes",
						type: "display",
					},
					{
						field: "createFromBackup",
						operator: "equals",
						value: true,
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
						operator: "equals",
						value: "Kubernetes",
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
				infrastructure: "Kubernetes",
				url: "",
				title: "",
				tagline: "",
				theme: "wp-theme-2018",
				unitId: 0,
				languages: [],
				categories: [],
				downloadsProtectionScript: false,
				monitored: false,
				createFromBackup: false,
				backupEnvironment: availableEnvironments[0] || "test",
				backupSite: "",
				ticket: "",
				comment: "",
			},
			apiEndpoint: "/api/sites",
			method: "POST",
			submitButtonText: t("actions.create"),
			resetButtonText: t("actions.reset"),
			loadingText: t("actions.creating"),
			successTitle: t("add.success.title"),
			successMessage: t("add.success.message"),
			successActions: [
				{
					label: t("actions.viewSite"),
					url: (formData: SiteFormType) => formData.url,
					icon: Eye,
				},
				{
					label: t("actions.edit"),
					url: (formData: SiteFormType, response: unknown) => {
						const siteId = (response as { siteId?: string })?.siteId;
						return siteId ? `/sites/${siteId}/edit` : "/error";
					},
					icon: Edit,
				},
			],
			errorMessage: t("add.error.title"),
			onSuccess: () => { },
			onError: (error) => {
				console.error("Error creating site:", error);
			},
			onFieldChange: async (fieldName: string, value: unknown) => {
				if (fieldName === "backupEnvironment" && typeof value === "string") {
					loadBackupSites(value);
				} else if (fieldName === "backupSite" && typeof value === "string" && value) {
					const environment = formRef?.getValues("backupEnvironment") || availableEnvironments[0] || "test";
					await loadSiteDetails(value, environment);
				}
			},
			onFormRef: (ref: UseFormReturn<SiteFormType>) => {
				setFormRef(ref);
			},
		};
	};

	return (
		<div className="w-full flex-1 flex flex-col h-full overflow-y-auto">
			<div className="pb-3">
				<div className="p-6 pb-4 flex-shrink-0 mt-1">
					<div className="flex items-center justify-between h-10">
						<h1 className="text-3xl font-bold">{t("add.title")}</h1>
					</div>
				</div>
				<div className="px-6 pb-0 h-full">
					<Form config={getFormConfig()} />
				</div>
			</div>
		</div>
	);
};
