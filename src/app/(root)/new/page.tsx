"use client";
import { decode } from "html-entities";
import { Edit, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Form } from "@/components/form";
import { OPTIONAL_CATEGORIES } from "@/constants/categories";
import { ENVIRONMENTS } from "@/constants/environments";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/constants/languages";
import { THEMES } from "@/constants/theme";
import { useZodErrorMessages } from "@/hooks/zod";
import { getPersons, getUnits } from "@/services/api";
import { getAvailableEnvironments, getBackupSites } from "@/services/backup";
import { createSiteAction } from "@/services/site";
import type { BackupEnvironment } from "@/types/backup";
import type { FieldConfig, FormConfig, SectionConfig, SelectOption } from "@/types/form";
import type { ServiceResponse } from "@/types/response";
import { type SiteForm, siteSchema } from "@/types/site";

export default function SiteAddPage() {
	const locale = useLocale();
	const errorMessages = useZodErrorMessages();

	const [environments, setEnvironments] = useState<string[]>([]);
	const [units, setUnits] = useState<SelectOption[]>([]);
	const [persons, setPersons] = useState<SelectOption[]>([]);
	const [backupSites, setBackupSites] = useState<SelectOption[]>([]);
	const [formRef, setFormRef] = useState<UseFormReturn<SiteForm> | null>(null);
	const [loadings, setLoadings] = useState<{ [key: string]: boolean }>({});

	const translations = {
		site: useTranslations("site"),
		actions: useTranslations("actions"),
	};

	const loadBackupSites = useCallback((environment: string) => {
		setLoadings((prev) => ({ ...prev, backupSites: true }));
		getBackupSites(environment as BackupEnvironment)
			.then((sites) => setBackupSites(sites.map((site) => ({ value: site.id, label: site.url }))))
			.catch(() => setBackupSites([]))
			.finally(() => setLoadings((prev) => ({ ...prev, backupSites: false })));
	}, []);

	useEffect(() => {
		if (environments.length > 0 && formRef) {
			const currentEnv = formRef.getValues("backupEnvironment") as string;
			if (!environments.includes(currentEnv as BackupEnvironment)) {
				formRef.setValue("backupEnvironment", environments[0] as BackupEnvironment);
			}
		}
	}, [environments, formRef]);

	useEffect(() => {
		const loadData = async () => {
			setLoadings({ environments: true, units: true, backupSites: true, persons: true });
			await Promise.all([
				getAvailableEnvironments()
					.then((envs) => {
						setEnvironments(envs);
						loadBackupSites(envs[0] || "test");
					})
					.catch(() => setEnvironments([]))
					.finally(() => setLoadings((prev) => ({ ...prev, environments: false }))),
				getUnits()
					.then((result) => result.success && setUnits(result.data.map((u) => ({ value: Number(u.id), label: `${u.name} (${u.id})` }))))
					.catch(() => setUnits([]))
					.finally(() => setLoadings((prev) => ({ ...prev, units: false }))),
				getPersons()
					.then((result) => result.success && setPersons(result.data.map((p) => ({ value: p.id, label: p.name }))))
					.catch(() => setPersons([]))
					.finally(() => setLoadings((prev) => ({ ...prev, persons: false }))),
			]);
		};
		loadData();
	}, [loadBackupSites]);

	const loadSiteDetails = async (siteId: string, environment: string) => {
		if (!formRef || !siteId) return;
		try {
			const sites = await getBackupSites(environment as BackupEnvironment);
			const selectedSite = sites.find((site) => site.id === siteId);
			if (selectedSite) {
				formRef.setValue("title", decode(selectedSite.title) || "");
				formRef.setValue("tagline", decode(selectedSite.tagline) || "");
				formRef.setValue("theme", selectedSite.theme || "wp-theme-2018");
				formRef.setValue("unitId", selectedSite.unitId || 0);
				formRef.setValue("languages", selectedSite.languages || []);
				formRef.setValue("categories", selectedSite.categories || []);
			}
		} catch {
			// silently fail — form stays as-is
		}
	};

	const getFormConfig = (): FormConfig<SiteForm> => {
		const fields: FieldConfig[] = [
			{
				name: "infrastructure",
				type: "boxes",
				label: translations.site("form.infrastructure.label"),
				section: "general",
				width: "full",
				options: Object.values(INFRASTRUCTURES)
					.filter((infrastructure) => infrastructure.CREATED)
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
				label: translations.site("form.url.label"),
				placeholder: translations.site("form.url.placeholder"),
				section: "general",
				width: "full",
			},
			{
				name: "title",
				type: "text",
				label: translations.site("form.title.label"),
				placeholder: translations.site("form.title.placeholder"),
				section: "details",
				width: "half",
				conditions: [{ field: "infrastructure", operator: "regex", value: "^(Kubernetes|External|LAMP|Archived)$", type: "display" }],
			},
			{
				name: "tagline",
				type: "text",
				label: translations.site("form.tagline.label"),
				placeholder: translations.site("form.tagline.placeholder"),
				section: "details",
				width: "half",
				conditions: [{ field: "infrastructure", operator: "regex", value: "^(Kubernetes|External|LAMP|Archived)$", type: "display" }],
			},
			{
				name: "theme",
				type: "select",
				label: translations.site("form.theme.label"),
				placeholder: translations.site("form.theme.placeholder"),
				section: "details",
				options: Object.values(THEMES).map((theme) => ({ value: theme.NAME, label: theme.LABEL[locale as "fr" | "en"] || theme.NAME })),
				width: "full",
				conditions: [
					{ field: "infrastructure", operator: "equals", value: "Kubernetes", type: "display" },
					{ field: "url", operator: "regex", value: "^https?://(?!(?:inside|www|wpn-test)[.])([a-zA-Z0-9-]+[.])*[a-zA-Z0-9-]+[.]epfl[.]ch(/.*)?$", type: "default", defaultValue: "wp-theme-light" },
					{ field: "url", operator: "regex", value: "^https?://(?!(?:inside|www|wpn-test)[.])([a-zA-Z0-9-]+[.])*[a-zA-Z0-9-]+[.]epfl[.]ch(/.*)?$", type: "disabled" },
				],
			},
			{
				name: "unitId",
				type: "search",
				label: translations.site("form.unitId.label"),
				placeholder: translations.site("form.unitId.placeholder"),
				section: "details",
				width: "half",
				options: units,
			},
			{
				name: "languages",
				type: "multiselect",
				label: translations.site("form.languages.label"),
				section: "details",
				width: "half",
				options: Object.values(LANGUAGES).map((lang) => ({ value: lang.locale, label: lang.common, default: DEFAULT_LANGUAGE.map((l) => l.locale).includes(lang.locale) })),
				conditions: [{ field: "infrastructure", operator: "equals", value: "Kubernetes", type: "display" }],
			},
			{
				name: "categories",
				type: "multiselect",
				label: translations.site("form.categories.label"),
				section: "details",
				width: "full",
				options: Object.values(OPTIONAL_CATEGORIES).map((category) => ({ value: category.NAME, label: category.LABEL })),
				conditions: [
					{ field: "infrastructure", operator: "equals", value: "Kubernetes", type: "display" },
					{ field: "url", operator: "regex", value: "^https?://www[.]epfl[.]ch/labs(/.*)?$", type: "default", defaultValue: ["epfl-menus"] },
					{ field: "url", operator: "regex", value: "^https?://www[.]epfl[.]ch/research/domains(/.*)?$", type: "default", defaultValue: ["epfl-menus"] },
					{ field: "url", operator: "regex", value: "^https?://www[.]epfl[.]ch(/.*)?$", type: "default", defaultValue: ["epfl-menus", "EPFL Translate"] },
				],
			},
			{
				name: "downloadsProtectionScript",
				type: "checkbox",
				label: translations.site("form.downloadsProtectionScript.label"),
				placeholder: translations.site("form.downloadsProtectionScript.placeholder"),
				section: "advanced",
				width: "full",
				conditions: [
					{ field: "infrastructure", operator: "equals", value: "Kubernetes", type: "display" },
					{ field: "url", operator: "regex", value: "^https?://inside[.]epfl[.]ch(/.*)?$", type: "default", defaultValue: true },
					{ field: "url", operator: "regex", value: "^https?://inside[.]epfl[.]ch(/.*)?$", type: "disabled" },
				],
			},
			{
				name: "monitored",
				type: "checkbox",
				label: translations.site("form.monitored.label"),
				placeholder: translations.site("form.monitored.placeholder"),
				section: "advanced",
				width: "full",
				conditions: [{ field: "infrastructure", operator: "equals", value: "Kubernetes", type: "display" }],
			},
			...(environments.length >= 1
				? [
						{
							name: "createFromBackup" as const,
							type: "checkbox" as const,
							label: `${translations.site("form.createFromBackup.label")}`,
							placeholder: translations.site("form.createFromBackup.placeholder"),
							section: "advanced" as const,
							width: "full" as const,
							disabled: false,
							conditions: [{ field: "infrastructure", operator: "equals" as const, value: "Kubernetes", type: "display" as const }],
						},
					]
				: []),
			...(environments.length > 1
				? [
						{
							name: "backupEnvironment" as const,
							type: "select" as const,
							label: translations.site("form.backupEnvironment.label"),
							placeholder: translations.site("form.backupEnvironment.placeholder"),
							section: "advanced" as const,
							width: "full" as const,
							options: environments.map((env) => {
								const envConfig = ENVIRONMENTS.find((e) => e.name === env);
								return { value: env, label: envConfig?.displayName || env };
							}),
							conditions: [
								{ field: "infrastructure", operator: "equals" as const, value: "Kubernetes", type: "display" as const },
								{ field: "createFromBackup", operator: "equals" as const, value: true, type: "display" as const },
							],
						},
					]
				: []),
			{
				name: "backupSite",
				type: "search",
				label: translations.site("form.backupSite.label"),
				placeholder: loadings.backupSites ? "Loading..." : translations.site("form.backupSite.placeholder"),
				section: "advanced",
				width: "full",
				options: backupSites,
				disabled: loadings.backupSites,
				conditions: [
					{ field: "infrastructure", operator: "equals", value: "Kubernetes", type: "display" },
					{ field: "createFromBackup", operator: "equals", value: true, type: "display" },
				],
			},
			{
				name: "ticket",
				type: "text",
				label: translations.site("form.ticket.label"),
				placeholder: translations.site("form.ticket.placeholder"),
				section: "metadata",
				width: "half",
			},
			{
				name: "responsibles",
				type: "multicombobox",
				label: translations.site("form.responsibles.label"),
				placeholder: loadings.persons ? "Loading..." : translations.site("form.responsibles.placeholder"),
				section: "metadata",
				width: "half",
				options: persons,
				disabled: loadings.persons,
			},
			{
				name: "comment",
				type: "textarea",
				label: translations.site("form.comment.label"),
				placeholder: translations.site("form.comment.placeholder"),
				section: "metadata",
				width: "full",
			},
		];

		const sections: SectionConfig[] = [
			{ name: "general", title: translations.site("form.sections.general.title"), columns: 1 },
			{
				name: "details",
				title: translations.site("form.sections.details.title"),
				columns: 2,
				conditions: [{ field: "infrastructure", operator: "regex", value: "^(Kubernetes|External|LAMP|Archived)$" }],
			},
			{
				name: "advanced",
				title: translations.site("form.sections.advanced.title"),
				columns: 1,
				conditions: [{ field: "infrastructure", operator: "equals", value: "Kubernetes" }],
			},
			{ name: "metadata", title: translations.site("form.sections.metadata.title"), columns: 2 },
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
				backupEnvironment: environments[0] || "test",
				backupSite: "",
				ticket: "",
				comment: "",
				responsibles: [],
			},
			serverAction: createSiteAction as (data: SiteForm) => Promise<ServiceResponse<unknown>>,
			submitButtonText: translations.site("create.label"),
			resetButtonText: translations.actions("reset"),
			loadingText: translations.actions("creating"),
			successTitle: translations.site("create.success"),
			successMessage: translations.site("create.successMessage"),
			successActions: [
				{
					label: translations.site("visitSite"),
					url: (formData: SiteForm) => formData.url,
					icon: Eye,
				},
				{
					label: translations.site("edit"),
					url: (_formData: SiteForm, response: unknown) => {
						const r = response as ServiceResponse<{ siteId: string }>;
						if (r?.success) return `/sites/${r.data.siteId}/edit`;
						return "/error";
					},
					icon: Edit,
				},
			],
			errorMessage: translations.site("create.error"),
			onSuccess: () => {},
			onError: (err) => console.error("Error creating site:", err),
			onFieldChange: async (fieldName: string, value: unknown) => {
				if (fieldName === "backupEnvironment" && typeof value === "string") {
					await loadBackupSites(value);
				} else if (fieldName === "backupSite" && typeof value === "string" && value) {
					const environment = formRef?.getValues("backupEnvironment") || environments[0] || "test";
					await loadSiteDetails(value, environment);
				}
			},
			onFormRef: (ref: UseFormReturn<SiteForm>) => setFormRef(ref),
		};
	};

	return (
		<div className="w-full flex-1 flex flex-col h-full overflow-y-auto">
			<div className="pb-3">
				<div className="p-6 pb-4 shrink-0 mt-1">
					<h1 className="text-3xl font-bold">{translations.site("add")}</h1>
				</div>
				<div className="px-6 pb-0 h-full">
					<Form config={getFormConfig()} />
				</div>
			</div>
		</div>
	);
}
