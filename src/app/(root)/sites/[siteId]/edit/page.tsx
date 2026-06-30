"use client";
import { decode } from "html-entities";
import { CircleCheck, Info, Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import moment from "moment";
import "moment/locale/fr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Form } from "@/components/form";
import { Button } from "@/components/ui/button";
import { OPTIONAL_CATEGORIES } from "@/constants/categories";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/constants/languages";
import { THEMES } from "@/constants/theme";
import { useServerEvents } from "@/hooks/useServerEvents";
import { useZodErrorMessages } from "@/hooks/zod";
import { getPersons, getPersonsByIds, getUnits } from "@/services/api";
import { getSiteLogsAction } from "@/services/logs";
import { getSite, updateSiteAction } from "@/services/site";
import type { FieldConfig, FormConfig, SectionConfig, SelectOption } from "@/types/form";
import type { LogType } from "@/types/log";
import type { ServiceResponse } from "@/types/response";
import { isKubernetesSite, type Site, type SiteEvent, type SiteForm, siteSchema } from "@/types/site";

const LOG_ACTION_CONFIG: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
	create: { color: "#10b981", icon: Plus },
	update: { color: "#3b82f6", icon: Pencil },
	delete: { color: "#ef4444", icon: Trash2 },
};

function cleanLogMessage(message: string, siteUrl?: string): string {
	let msg = message.replace(/'''|(\*\*)/g, "");
	if (siteUrl)
		msg = msg
			.replace(`Site ${siteUrl}`, "")
			.replace(/\s*\(Kubernetes\)\s*updated:\s*/i, "")
			.trim();
	return msg;
}

export default function SiteUpdatePage() {
	const params = useParams();
	const siteId = params.siteId as string;
	const locale = useLocale();
	const errorMessages = useZodErrorMessages();

	const [site, setSite] = useState<Site | null>(null);
	const [wasCreating, setWasCreating] = useState(false);
	const [units, setUnits] = useState<SelectOption[]>([]);
	const [persons, setPersons] = useState<SelectOption[]>([]);
	const [loadings, setLoadings] = useState<{ [key: string]: boolean }>({});
	const [siteLogs, setSiteLogs] = useState<LogType[]>([]);

	const translations = {
		site: useTranslations("site"),
		actions: useTranslations("actions"),
	};

	useEffect(() => {
		getSite(siteId).then(({ site: data }) => {
			if (data) {
				setSite(data);
				if (data.creating) setWasCreating(true);
				// The bulk persons list (getPersons) is capped on the real LDAP directory, so already-assigned
				// responsibles may be missing from it and wouldn't render. Resolve them by id and merge them in.
				if (data.responsibles?.length) {
					getPersonsByIds(data.responsibles).then((res) => {
						if (!res.success) return;
						setPersons((prev) => {
							const merged = new Map(prev.map((p) => [p.value, p]));
							for (const person of res.data) merged.set(person.id, { value: person.id, label: person.name });
							return Array.from(merged.values());
						});
					});
				}
			}
		});
		getSiteLogsAction(siteId).then(({ logs }) => {
			setSiteLogs(logs.filter((l) => ["create", "update", "delete"].includes(l.data.action)).slice(0, 2));
		});
	}, [siteId]);

	// Keep the lifecycle flags (`creating`/`deletedAt`/`managed`) in sync in real time without clobbering the form's loaded data.
	useServerEvents<{ site: SiteEvent }>("/api/sites/events", {
		site: (event) => {
			if (event.id !== siteId || event.type === "deleted") return;
			if (event.site.creating) setWasCreating(true);
			setSite((prev) => (prev ? { ...prev, creating: event.site.creating, deletedAt: event.site.deletedAt, managed: event.site.managed } : event.site));
		},
	});

	useEffect(() => {
		const loadData = async () => {
			setLoadings({ units: true, persons: true });
			await Promise.all([
				getUnits()
					.then((result) => result.success && setUnits(result.data.map((u) => ({ value: Number(u.id), label: `${u.name} (${u.id})` }))))
					.finally(() => setLoadings((prev) => ({ ...prev, units: false })))
					.catch((error) => console.error("Error loading units:", error)),
				getPersons()
					.then(
						(result) =>
							result.success &&
							// Merge (don't replace) so the responsibles resolved by id aren't clobbered, regardless of which request finishes first.
							setPersons((prev) => {
								const merged = new Map(prev.map((p) => [p.value, p]));
								for (const person of result.data) if (!merged.has(person.id)) merged.set(person.id, { value: person.id, label: person.name });
								return Array.from(merged.values());
							}),
					)
					.finally(() => setLoadings((prev) => ({ ...prev, persons: false })))
					.catch((error) => console.error("Error loading persons:", error)),
			]);
		};
		loadData();
	}, []);

	const getFormConfig = (site: Site): FormConfig<SiteForm> => {
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
				width: "half",
				fieldClassName: "h-[120px]",
			},
			{
				name: "siteLogs",
				type: "custom",
				label: translations.site("logs.title"),
				section: "metadata",
				width: "half",
				render: () => (
					<div className="border border-input rounded-md divide-y divide-input">
						{siteLogs.length === 0 ? (
							<p className="px-2.5 py-2 text-xs text-muted-foreground">{translations.site("logs.empty")}</p>
						) : (
							siteLogs.map((log) => {
								const cfg = LOG_ACTION_CONFIG[log.data.action] ?? LOG_ACTION_CONFIG.update;
								const Icon = cfg.icon;
								return (
									<div
										key={log.id}
										className="flex items-center gap-2 px-2.5 py-2 text-xs"
										title={`${cleanLogMessage(log.message, site.url)}\n${moment(log.timestamp).locale(locale).format("LLL")} (${log.user?.name})`}
									>
										<span className="shrink-0 rounded p-1" style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}>
											<Icon className="size-3" />
										</span>
										<span className="truncate flex-1 text-foreground">{cleanLogMessage(log.message, site.url)}</span>
										<span className="shrink-0 whitespace-nowrap text-[10px] text-muted-foreground">{moment(log.timestamp).locale(locale).fromNow()}</span>
									</div>
								);
							})
						)}
					</div>
				),
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
				infrastructure: (site.infrastructure as SiteForm["infrastructure"]) || "Kubernetes",
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
			serverAction: updateSiteAction.bind(null, site.id) as (data: SiteForm) => Promise<ServiceResponse<unknown>>,
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
					<div className="flex min-w-0 items-center gap-3">
						{site && (
							<h1 className="flex min-w-0 items-baseline gap-2 text-3xl font-bold">
								<span className="font-normal text-muted-foreground">{site.creating ? translations.site("createPrefix") : translations.site("editPrefix")}</span>
								<span className="text-muted-foreground">·</span>
								<span className="truncate">{"title" in site && site.title ? decode(site.title) : site.url}</span>
							</h1>
						)}
						{site?.creating ? (
							<span className="inline-flex shrink-0 items-center gap-1.5 border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
								<Loader2 className="size-3.5 animate-spin" />
								{translations.site("creating")}
							</span>
						) : (
							wasCreating && (
								<span className="inline-flex shrink-0 items-center gap-1.5 border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
									<CircleCheck className="size-3.5" />
									{translations.site("created")}
								</span>
							)
						)}
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
