"use client";
import { decode } from "html-entities";
import { Info, Tags } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Form } from "@/components/form";
import { SiteLogs } from "@/components/site-logs";
import { Button } from "@/components/ui/button";
import { OPTIONAL_CATEGORIES } from "@/constants/categories";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/constants/languages";
import { THEMES } from "@/constants/theme";
import { useZodErrorMessages } from "@/hooks/zod";
import { getPersons, getUnits } from "@/services/api";
import { getSite, updateSiteAction } from "@/services/site";
import type { FieldConfig, FormConfig, SectionConfig, SelectOption } from "@/types/form";
import type { ServiceResponse } from "@/types/response";
import { isKubernetesSite, type SiteFormType, type SiteType, siteSchema } from "@/types/site";

export default function SiteUpdatePage() {
	const params = useParams();
	const siteId = params.siteId as string;
	const locale = useLocale();
	const errorMessages = useZodErrorMessages();

	const [site, setSite] = useState<SiteType | null>(null);
	const [units, setUnits] = useState<SelectOption[]>([]);
	const [persons, setPersons] = useState<SelectOption[]>([]);
	const [loadings, setLoadings] = useState<{ [key: string]: boolean }>({});

	const translations = {
		site: useTranslations("site"),
		actions: useTranslations("actions"),
	};

	useEffect(() => {
		getSite(siteId).then(({ site: data }) => {
			if (data) setSite(data);
		});
	}, [siteId]);

	useEffect(() => {
		const loadData = async () => {
			setLoadings({ units: true, persons: true });
			await Promise.all([
				getUnits()
					.then((result) => result.success && setUnits(result.data.map((u) => ({ value: Number(u.id), label: `${u.name} (${u.id})` }))))
					.finally(() => setLoadings((prev) => ({ ...prev, units: false })))
					.catch((error) => console.error("Error loading units:", error)),
				getPersons()
					.then((result) => result.success && setPersons(result.data.map((p) => ({ value: p.id, label: p.name }))))
					.finally(() => setLoadings((prev) => ({ ...prev, persons: false })))
					.catch((error) => console.error("Error loading persons:", error)),
			]);
		};
		loadData();
	}, []);

	const getFormConfig = (site: SiteType): FormConfig<SiteFormType> => {
		const fields: FieldConfig[] = [
			{
				name: "infrastructure",
				type: "boxes",
				label: translations.site("form.infrastructure.label"),
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
				label: translations.site("form.url.label"),
				placeholder: translations.site("form.url.placeholder"),
				section: "general",
				width: "full",
				disabled: true,
			},
			{
				name: "title",
				type: "text",
				label: translations.site("form.title.label"),
				placeholder: translations.site("form.title.placeholder"),
				section: "details",
				width: "half",
				disabled: true,
				conditions: [{ field: "infrastructure", operator: "regex", value: "^(Kubernetes|External|LAMP|Archived)$", type: "display" }],
			},
			{
				name: "tagline",
				type: "text",
				label: translations.site("form.tagline.label"),
				placeholder: translations.site("form.tagline.placeholder"),
				section: "details",
				width: "half",
				disabled: true,
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
				disabled: true,
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
				placeholder: loadings.units ? "Loading..." : translations.site("form.unitId.placeholder"),
				section: "details",
				width: "half",
				options: units,
				disabled: loadings.units,
			},
			{
				name: "languages",
				type: "multiselect",
				label: translations.site("form.languages.label"),
				section: "details",
				width: "half",
				options: Object.values(LANGUAGES).map((lang) => ({
					value: lang.locale,
					label: lang.common,
					default: DEFAULT_LANGUAGE.map((lang) => lang.locale).includes(lang.locale),
				})),
				conditions: [{ field: "infrastructure", operator: "equals", value: "Kubernetes", type: "display" }],
			},
			{
				name: "categories",
				type: "multiselect",
				label: translations.site("form.categories.label"),
				section: "details",
				width: "full",
				options: Object.values(OPTIONAL_CATEGORIES).map((category) => ({ value: category.NAME, label: category.LABEL })),
				conditions: [{ field: "infrastructure", operator: "equals", value: "Kubernetes", type: "display" }],
			},
			{
				name: "downloadsProtectionScript",
				type: "checkbox",
				label: translations.site("form.downloadsProtectionScript.label"),
				placeholder: translations.site("form.downloadsProtectionScript.placeholder"),
				section: "advanced",
				width: "full",
				conditions: [{ field: "infrastructure", operator: "equals", value: "Kubernetes", type: "display" }],
				disabled: true,
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
				infrastructure: site.infrastructure || "kubernetes",
				url: site.url || "",
				title: "title" in site && site.title ? decode(site.title) : "",
				tagline: "tagline" in site && site.tagline ? decode(site.tagline) : "",
				theme: (isKubernetesSite(site) && site.theme) || "",
				unitId: (isKubernetesSite(site) && site.unitId) || 0,
				languages: (isKubernetesSite(site) && site.languages) || [],
				categories: (isKubernetesSite(site) && site.categories) || [],
				downloadsProtectionScript: (isKubernetesSite(site) && site.downloadsProtectionScript) || false,
				ticket: site.ticket || undefined,
				comment: site.comment || undefined,
				monitored: site.monitored ?? false,
				responsibles: site.responsibles || [],
			},
			serverAction: updateSiteAction.bind(null, site.id) as (data: SiteFormType) => Promise<ServiceResponse<unknown>>,
			reset: false,
			submitButtonText: translations.site("update.label"),
			resetButtonText: translations.actions("reset"),
			loadingText: translations.actions("updating"),
			successTitle: translations.site("update.success"),
			successMessage: translations.site("update.successMessage"),
			errorMessage: translations.site("update.error"),
			onSuccess: () => {},
			onError: (error) => console.error("Error updating site:", error),
		};
	};

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 shrink-0 mt-1">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-3xl font-bold">{translations.site("update.title")}</h1>
						{site && <SiteLogs siteId={siteId} siteUrl={site.url} />}
					</div>
					<div className="flex gap-2">
						<Button variant="outline" asChild>
							<Link href={`/search?url=${site?.url ?? ""}`}>
								<Info className="size-4" />
								{translations.site("info")}
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href={`/sites/${siteId}/tags`}>
								<Tags className="size-4" />
								{translations.site("manageTags")}
							</Link>
						</Button>
					</div>
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">{site && <Form config={getFormConfig(site)} />}</div>
		</div>
	);
}
