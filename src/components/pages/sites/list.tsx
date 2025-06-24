"use client";
import React, { useEffect, useState } from "react";
import { isKubernetesSite, SiteType, isDatabaseSite, isNoneSite } from "@/types/site";
import { GlobeIcon, Info, Pencil, Plus, Tags, MoreHorizontal, Filter, Download, BarChart3, Languages, ChevronRight, Calendar, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableColumn } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import moment from "moment";
import "moment/locale/fr";
import { PERMISSIONS } from "@/constants/permissions";
import { THEMES } from "@/constants/theme";
import { ThemeType } from "@/types/theme";
import { DeleteDialog } from "@/components/dialog/delete";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import { InfrastructureType } from "@/types/infrastructure";
import { useSearchParams } from "next/navigation";
import { LANGUAGES } from "@/constants/languages";
import { OPTIONAL_CATEGORIES } from "@/constants/categories";

interface Filters {
	url: string;
	infrastructure: string;
	theme: string;
	hasCategories: boolean | null;
	hasDownloadsProtection: boolean | null;
	dateRange: {
		from?: Date;
		to?: Date;
	};
	languages: string[];
	categories: string[];
}

export const SiteList: React.FC<{ sites: SiteType[]; permissions: string[] }> = ({ sites, permissions }) => {
	const searchParams = useSearchParams();
	
	const getInitialFilters = () => {
		const filters: Filters = {
			url: searchParams.get("url") || "",
			infrastructure: searchParams.get("infrastructure") || "",
			theme: searchParams.get("theme") || "",
			hasCategories: searchParams.get("hasCategories") === "true" ? true : searchParams.get("hasCategories") === "false" ? false : null,
			hasDownloadsProtection: searchParams.get("hasDownloadsProtection") === "true" ? true : searchParams.get("hasDownloadsProtection") === "false" ? false : null,
			dateRange: {
				from: searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined,
				to: searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined,
			},
			languages: searchParams.get("languages") ? searchParams.get("languages")!.split(",").filter(Boolean) : [],
			categories: searchParams.get("categories") ? searchParams.get("categories")!.split(",").filter(Boolean) : [],
		};

		return filters;
	};

	const blankFilters: Filters = {
		url: "",
		infrastructure: "",
		theme: "",
		hasCategories: null,
		hasDownloadsProtection: null,
		dateRange: {
			from: undefined,
			to: undefined,
		},
		languages: [],
		categories: [],
	};

	const initialFilters = getInitialFilters();
	
	const [filters, setFilters] = useState<Filters>(initialFilters);
	
	const [showMoreTools, setShowMoreTools] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [showExport, setShowExport] = useState(false);
	const [showStatistics, setShowStatistics] = useState(false);

	const t = useTranslations("site");
	const locale = useLocale();

	useEffect(() => {
		moment.locale(locale);
	}, [locale]);

	const updateURL = (filters: Filters) => {
		const params = new URLSearchParams();
		
		if (filters.url) params.set("url", filters.url);
		if (filters.infrastructure) params.set("infrastructure", filters.infrastructure);
		if (filters.theme) params.set("theme", filters.theme);
		
		if (filters.hasCategories !== null) {
			params.set("hasCategories", filters.hasCategories.toString());
		}
		if (filters.hasDownloadsProtection !== null) {
			params.set("hasDownloadsProtection", filters.hasDownloadsProtection.toString());
		}
		if (filters.dateRange.from) {
			params.set("dateFrom", filters.dateRange.from.toISOString().split("T")[0]);
		}
		if (filters.dateRange.to) {
			params.set("dateTo", filters.dateRange.to.toISOString().split("T")[0]);
		}
		if (filters.languages.length > 0) {
			params.set("languages", filters.languages.join(","));
		}
		if (filters.categories.length > 0) {
			params.set("categories", filters.categories.join(","));
		}
		
		const queryString = params.toString();
		const newUrl = queryString ? `?${queryString}` : window.location.pathname;
		
		if (window.location.search !== `?${queryString}` && !(window.location.search === "" && queryString === "")) {
			window.history.replaceState({}, "", newUrl);
		}
	};

	const updateFilters = (newFilters: Filters) => {
		setFilters(newFilters);
		updateURL(newFilters);
	};

	const getInfrastructureConfig = (typeName: string): InfrastructureType | undefined => {
		return Object.values(INFRASTRUCTURES).find((infrastructure) => infrastructure.NAME === typeName);
	};

	const formatRelativeDate = (date: Date) => {
		const relative = moment(date).fromNow();
		return relative.charAt(0).toUpperCase() + relative.slice(1);
	};

	const filteredSites = sites.filter((site) => {
		const matchesUrl = site.url.toLowerCase().includes(filters.url.toLowerCase());
		const matchesType = !filters.infrastructure || site.infrastructure === filters.infrastructure;
		const matchesTheme = !filters.theme || (isKubernetesSite(site) && site.theme === filters.theme);
		const matchesDateFrom = !filters.dateRange.from || !site.createdAt || moment(site.createdAt).isAfter(moment(filters.dateRange.from));
		const matchesDateTo = !filters.dateRange.to || !site.createdAt || moment(site.createdAt).isBefore(moment(filters.dateRange.to));
		const matchesLanguages = !filters.languages.length || (isKubernetesSite(site) && site.languages && filters.languages.some(lang => site.languages.includes(lang)));
		const matchesCategories = !filters.categories.length || (isKubernetesSite(site) && site.categories && filters.categories.some(cat => site.categories.includes(cat)));
		const matchesHasCategories = filters.hasCategories === null || (isKubernetesSite(site) && site.categories !== undefined && (site.categories.length > 0) === filters.hasCategories);
		const matchesDownloadsProtection = filters.hasDownloadsProtection === null || (isKubernetesSite(site) && site.downloadsProtectionScript !== undefined && site.downloadsProtectionScript === filters.hasDownloadsProtection);
		
		return matchesUrl && matchesType && matchesTheme && matchesDateFrom && matchesDateTo && matchesLanguages && matchesCategories && matchesHasCategories && matchesDownloadsProtection;
	});

	const getStatistics = () => {
		const totalSites = sites.length;
		const kubernetesSites = sites.filter(isKubernetesSite);
		const databaseSites = sites.filter(isDatabaseSite);
		const noneSites = sites.filter(isNoneSite);

		const infrastructureStats = Object.values(INFRASTRUCTURES).map((infrastructure) => ({
			name: infrastructure.LABEL[locale as "fr" | "en"] || infrastructure.NAME,
			count: sites.filter(site => site.infrastructure === infrastructure.NAME).length,
			percentage: Math.round((sites.filter(site => site.infrastructure === infrastructure.NAME).length / totalSites) * 100),
		}));

		const themeStats = Object.values(THEMES).map((theme) => ({
			name: theme.LABEL[locale as "fr" | "en"] || theme.NAME,
			count: kubernetesSites.filter(site => site.theme === theme.NAME).length,
			percentage: kubernetesSites.length > 0 ? Math.round((kubernetesSites.filter(site => site.theme === theme.NAME).length / kubernetesSites.length) * 100) : 0,
		}));

		const languageStats = Object.values(LANGUAGES).map(language => ({
			name: language.common,
			count: kubernetesSites.filter(site => site.languages.includes(language.locale)).length,
			percentage: kubernetesSites.length > 0 ? Math.round((kubernetesSites.filter(site => site.languages.includes(language.locale)).length / kubernetesSites.length) * 100) : 0,
		}));

		const categoryStats = OPTIONAL_CATEGORIES.map(category => ({
			name: category.LABEL,
			count: kubernetesSites.filter(site => site.categories.includes(category.NAME)).length,
			percentage: kubernetesSites.length > 0 ? Math.round((kubernetesSites.filter(site => site.categories.includes(category.NAME)).length / kubernetesSites.length) * 100) : 0,
		}));

		const recentSites = sites.filter(site => 
			moment(site.createdAt).isAfter(moment().subtract(30, "days")),
		).length;

		const sitesWithDownloadsProtection = kubernetesSites.filter(site => site.downloadsProtectionScript).length;
		const sitesWithCategories = kubernetesSites.filter(site => site.categories.length > 0).length;
		const multilingualSites = kubernetesSites.filter(site => site.languages.length > 1).length;

		const unitIds = kubernetesSites.map(site => site.unitId);
		const uniqueUnits = new Set(unitIds).size;
		const avgSitesPerUnit = uniqueUnits > 0 ? Math.round(kubernetesSites.length / uniqueUnits) : 0;

		return {
			totalSites,
			kubernetesSites: kubernetesSites.length,
			databaseSites: databaseSites.length,
			noneSites: noneSites.length,
			infrastructureStats: infrastructureStats.filter(stat => stat.count > 0),
			themeStats: themeStats.filter(stat => stat.count > 0),
			languageStats: languageStats.filter(stat => stat.count > 0).sort((a, b) => b.count - a.count),
			categoryStats: categoryStats.filter(stat => stat.count > 0).sort((a, b) => b.count - a.count),
			recentSites,
			sitesWithDownloadsProtection,
			sitesWithCategories,
			multilingualSites,
			uniqueUnits,
			avgSitesPerUnit,
		};
	};

	const exportToCSV = () => {
		const headers = [
			"URL",
			"Infrastructure",
			"Theme",
			"Title",
			"Tagline",
			"Unit ID",
			"Languages",
			"Categories",
			"Downloads Protection",
			"Created At",
			"Ticket",
			"Comment",
		];

		const csvData = filteredSites.map(site => [
			site.url,
			site.infrastructure,
			isKubernetesSite(site) ? site.theme || "" : "",
			isKubernetesSite(site) ? site.title || "" : "",
			isKubernetesSite(site) ? site.tagline || "" : "",
			isKubernetesSite(site) ? site.unitId.toString() : "",
			isKubernetesSite(site) ? site.languages.join(";") : "",
			isKubernetesSite(site) ? site.categories.join(";") : "",
			isKubernetesSite(site) ? (site.downloadsProtectionScript ? "Yes" : "No") : "",
			moment(site.createdAt).format("YYYY-MM-DD HH:mm:ss"),
			site.ticket || "",
			site.comment || "",
		]);

		const csvContent = [headers, ...csvData]
			.map(row => row.map(field => `"${field}"`).join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", `sites-${moment().format("YYYY-MM-DD")}.csv`);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const resetFilters = () => {
		setFilters(blankFilters);
		updateURL(blankFilters);
	};

	const handleToolSelect = (tool: string) => {
		setShowMoreTools(false);
		switch (tool) {
			case "filters":
				setShowFilters(true);
				break;
			case "export":
				setShowExport(true);
				break;
			case "statistics":
				setShowStatistics(true);
				break;
		}
	};

	const statistics = getStatistics();

	const columns: TableColumn<SiteType>[] = [
		{
			key: "url",
			label: t("list.column.url"),
			width: "w-[55%]",
			align: "left",
			sortable: true,
			render: (site) => (
				<a href={site.url} className="flex items-center gap-2 font-medium text-blue-600 hover:underline group" target="_blank" rel="noopener noreferrer">
					<GlobeIcon className="size-6 flex-shrink-0" />
					<span className="text-base font-medium leading-relaxed">{site.url}</span>
				</a>
			),
		},
		{
			key: "infrastructure",
			label: t("list.column.infrastructure"),
			width: "w-[15%]",
			align: "center",
			sortable: true,
			render: (site) => {
				const infrastructureConfig = getInfrastructureConfig(site.infrastructure);
				return (
					<div className="p-2 h-9 flex gap-1 justify-center items-center border-2 border-gray-200 text-gray-600">
						{infrastructureConfig?.ICON ? React.createElement(infrastructureConfig.ICON, { className: "size-4", strokeWidth: 2.3 }) : null}
						<span className="text-sm font-semibold uppercase">{infrastructureConfig?.LABEL[locale as "fr" | "en"] || infrastructureConfig?.NAME}</span>
					</div>
				);
			},
		},
		{
			key: "createdAt",
			label: t("list.column.createdAt"),
			width: "w-[15%]",
			align: "center",
			sortable: true,
			sortKey: "createdAt",
			render: (site) => (
				<div className="text-center">
					<p className="text-sm font-medium text-gray-700">{formatRelativeDate(site.createdAt)}</p>
				</div>
			),
		},
		{
			key: "actions",
			label: t("list.column.actions"),
			width: "w-[15%]",
			align: "left",
			sortable: false,
			render: (site) => (
				<div className="flex gap-1.5 items-center py-1">
					{permissions.includes(PERMISSIONS.SITES.READ) && (
						<Button variant="outline" className="p-1 w-9 h-9 border-2 border-gray-200 text-gray-600 hover:text-gray-600 hover:bg-gray-200" asChild>
							<Link href={`/search?url=${site.url}`}>
								<Info strokeWidth={2.3} className="size-5" />
							</Link>
						</Button>
					)}

					{permissions.includes(PERMISSIONS.SITES.UPDATE) && (
						<Button variant="outline" className="p-1 w-9 h-9 border-2 border-gray-200 text-gray-600 hover:text-gray-600 hover:bg-gray-200" asChild>
							<Link href={`/sites/${site.id}/edit`}>
								<Pencil strokeWidth={2.3} className="size-5" />
							</Link>
						</Button>
					)}

					{permissions.includes(PERMISSIONS.TAGS.ASSOCIATE) && (
						<Button variant="outline" className="p-1 w-9 h-9 border-2 border-gray-200 text-gray-600 hover:text-gray-600 hover:bg-gray-200" asChild>
							<Link href={`/sites/${site.id}/tags`}>
								<Tags strokeWidth={2.3} className="size-5" />
							</Link>
						</Button>
					)}

					{permissions.includes(PERMISSIONS.SITES.DELETE) && <DeleteDialog icon={GlobeIcon} displayName={site.url} type="site" apiEndpoint={`/api/sites/${site.id}`} />}
				</div>
			),
		},
	];

	const toolsMenuItems = [
		{
			id: "filters",
			icon: Filter,
			title: t("tools.menu.filters.title"),
			description: t("tools.menu.filters.description"),
		},
		{
			id: "export",
			icon: Download,
			title: t("tools.menu.export.title"),
			description: t("tools.menu.export.description"),
		},
		{
			id: "statistics",
			icon: BarChart3,
			title: t("tools.menu.statistics.title"),
			description: t("tools.menu.statistics.description"),
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">{t("list.title")}</h1>
					<div className="flex gap-2">
						<Dialog open={showMoreTools} onOpenChange={setShowMoreTools}>
							<DialogTrigger asChild>
								<Button variant="outline" className="h-10">
									<MoreHorizontal className="size-5" />
									{t("tools.button")}
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-md">
								<DialogHeader>
									<DialogTitle>{t("tools.menu.title")}</DialogTitle>
								</DialogHeader>
								<div className="space-y-1">
									{toolsMenuItems.map((tool) => (
										<Button
											key={tool.id}
											variant="ghost"
											className="w-full justify-start h-auto p-4 text-left"
											onClick={() => handleToolSelect(tool.id)}
										>
											<div className="flex items-center justify-between w-full gap-3">
												<div className="flex items-center gap-3">
													<tool.icon className="size-5 text-gray-600" />
													<div className="flex-1">
														<div className="font-medium">{tool.title}</div>
														<div className="text-sm text-gray-500">{tool.description}</div>
													</div>
												</div>
												<div>
													<ChevronRight className="size-4 text-gray-400" />
												</div>
											</div>
										</Button>
									))}
								</div>
							</DialogContent>
						</Dialog>

						<Dialog open={showFilters} onOpenChange={setShowFilters}>
							<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<Filter className="size-5" />
										{t("tools.filters.title")}
									</DialogTitle>
								</DialogHeader>
								<div className="space-y-6">
									<div className="grid gap-4">
										<div>
											<label className="text-sm font-medium mb-2 block">
												{t("tools.filters.url.label")}
											</label>
											<Input 
												onChange={(e) => {
													updateFilters({ ...filters, url: e.target.value });
												}} 
												value={filters.url}
												placeholder={t("tools.filters.url.placeholder")} 
												className="w-full"
											/>
										</div>
										
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium mb-2 block">
												{t("tools.filters.theme.label")}
											</label>
											<Select 
												onValueChange={(value) => updateFilters({ ...filters, theme: value === "all" ? "" : value })} 
												value={filters.theme || "all"}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={t("tools.filters.theme.placeholder")} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">{t("tools.filters.theme.all")}</SelectItem>
													{Object.values(THEMES).map((theme: ThemeType) => (
														<SelectItem key={theme.NAME} value={theme.NAME}>
															{theme?.LABEL[locale as "fr" | "en"] || theme.NAME}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div>
											<label className="text-sm font-medium mb-2 block">
												{t("tools.filters.infrastructure.label")}
											</label>
											<Select 
												onValueChange={(value) => {
													const infra = value === "all" ? "" : value;
													updateFilters({ ...filters, infrastructure: infra });
												}} 
												value={filters.infrastructure || "all"}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={t("tools.filters.infrastructure.placeholder")} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">{t("tools.filters.infrastructure.all")}</SelectItem>
													{Object.values(INFRASTRUCTURES).map((infrastructure: InfrastructureType) => (
														<SelectItem key={infrastructure.NAME} value={infrastructure.NAME}>
															{infrastructure?.LABEL[locale as "fr" | "en"] || infrastructure.NAME}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium mb-2 block">
												{t("tools.filters.languages")}
											</label>
											<div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
												{Object.values(LANGUAGES).map((language) => (
													<div key={language.locale} className="flex items-center space-x-2">
														<Checkbox
															id={`lang-${language}`}
															checked={filters.languages.includes(language.locale)}
															onCheckedChange={(checked) => {
																if (checked) {
																	updateFilters({
																		...filters,
																		languages: [...filters.languages, language.locale],
																	});
																} else {
																	updateFilters({
																		...filters,
																		languages: filters.languages.filter(l => l !== language.locale),
																	});
																}
															}}
														/>
														<label htmlFor={`lang-${language}`} className="text-sm">{language.common}</label>
													</div>
												))}
											</div>
										</div>
										<div>
											<label className="text-sm font-medium mb-2 block">
												{t("tools.filters.categories")}
											</label>
											<div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
												{Object.values(OPTIONAL_CATEGORIES).map((category) => (
													<div key={category.NAME} className="flex items-center space-x-2">
														<Checkbox
															id={`cat-${category}`}
															checked={filters.categories.includes(category.NAME)}
															onCheckedChange={(checked) => {
																if (checked) {
																	updateFilters({
																		...filters,
																		categories: [...filters.categories, category.NAME],
																	});
																} else {
																	updateFilters({
																		...filters,
																		categories: filters.categories.filter(c => c !== category.NAME),
																	});
																}
															}}
														/>
														<label htmlFor={`cat-${category}`} className="text-sm">{category.LABEL}</label>
													</div>
												))}
											</div>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="flex items-center space-x-2">
											<Checkbox
												id="has-categories"
												checked={filters.hasCategories === true}
												onCheckedChange={(checked) => 
													updateFilters({ ...filters, hasCategories: checked ? true : null })
												}
											/>
											<Label htmlFor="has-categories">{t("tools.filters.has.categories")}</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="has-downloads"
												checked={filters.hasDownloadsProtection === true}
												onCheckedChange={(checked) => 
													updateFilters({ ...filters, hasDownloadsProtection: checked ? true : null })
												}
											/>
											<Label htmlFor="has-downloads">{t("tools.filters.has.downloads")}</Label>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium mb-2 block">
												{t("tools.filters.date.from")}
											</label>
											<Input 
												type="date"
												value={filters.dateRange.from ? filters.dateRange.from.toISOString().split("T")[0] : ""}
												onChange={(e) => updateFilters({ 
													...filters, 
													dateRange: {
														...filters.dateRange,
														from: e.target.value ? new Date(e.target.value) : undefined,
													},
												})}
											/>
										</div>
										<div>
											<label className="text-sm font-medium mb-2 block">
												{t("tools.filters.date.to")}
											</label>
											<Input 
												type="date"
												value={filters.dateRange.to ? filters.dateRange.to.toISOString().split("T")[0] : ""}
												onChange={(e) => updateFilters({ 
													...filters, 
													dateRange: {
														...filters.dateRange,
														to: e.target.value ? new Date(e.target.value) : undefined,
													},
												})}
											/>
										</div>
									</div>

									<div className="flex gap-2 pt-4">
										<Button onClick={resetFilters} variant="outline" className="flex-1">
											{t("tools.filters.reset")}
										</Button>
										<Button onClick={() => setShowFilters(false)} className="flex-1">
											{t("tools.filters.apply")}
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>

						<Dialog open={showExport} onOpenChange={setShowExport}>
							<DialogContent className="max-w-md">
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<Download className="size-5" />
										{t("tools.export.title")}
									</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<p className="text-sm text-gray-600">
										{t("tools.export.description", { count: filteredSites.length })}
									</p>
									<div className="space-y-2">
										<Button onClick={exportToCSV} className="w-full">
											<Download className="size-4 mr-2" />
											{t("tools.export.csv.button")}
										</Button>
									</div>
									<div className="text-xs text-gray-500">
										{t("tools.export.format.info")}
									</div>
								</div>
							</DialogContent>
						</Dialog>

						<Dialog open={showStatistics} onOpenChange={setShowStatistics}>
							<DialogContent className="sm:max-w-1/2 max-h-[85vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<BarChart3 className="size-5" />
										{t("tools.statistics.title")}
									</DialogTitle>
								</DialogHeader>
								<div className="space-y-8">
									<div>
										<h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
											{t("tools.statistics.overview.title")}
										</h3>
										<div className="grid grid-cols-2 md:grid-cols-5 gap-2">
											<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
												<div className="text-2xl font-bold text-blue-600">{statistics.totalSites}</div>
												<div className="text-sm text-blue-700 font-medium">{t("tools.statistics.total.sites")}</div>
											</div>
											<div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
												<div className="text-2xl font-bold text-green-600">{filteredSites.length}</div>
												<div className="text-sm text-green-700 font-medium">{t("tools.statistics.filtered.sites")}</div>
											</div>
											<div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
												<div className="text-2xl font-bold text-purple-600">{statistics.recentSites}</div>
												<div className="text-sm text-purple-700 font-medium">{t("tools.statistics.recent.sites")}</div>
											</div>
											<div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
												<div className="text-2xl font-bold text-orange-600">{statistics.kubernetesSites}</div>
												<div className="text-sm text-orange-700 font-medium">{t("tools.statistics.kubernetes.sites")}</div>
											</div>
											<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
												<div className="text-2xl font-bold text-red-600">{statistics.multilingualSites}</div>
												<div className="text-sm text-red-700 font-medium">{t("tools.statistics.multilingual.sites")}</div>
											</div>
										</div>
									</div>
									<div>
										<h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
											{t("tools.statistics.breakdown.title")}
										</h3>
										<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
											<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
												<h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
													<Layers className="size-4" />
													{t("tools.statistics.infrastructure.title")}
												</h4>
												<div className="space-y-3">
													<div className="flex justify-between items-center">
														<span className="text-sm font-medium">{t("tools.statistics.infrastructure.kubernetes")}</span>
														<div className="flex items-center gap-2">
															<Badge variant="secondary" className="bg-blue-100 text-blue-800">{statistics.kubernetesSites}</Badge>
															<span className="text-xs text-gray-600 w-10 text-right font-medium">
																{Math.round((statistics.kubernetesSites / statistics.totalSites) * 100)}%
															</span>
														</div>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-sm font-medium">{t("tools.statistics.infrastructure.database")}</span>
														<div className="flex items-center gap-2">
															<Badge variant="secondary" className="bg-green-100 text-green-800">{statistics.databaseSites}</Badge>
															<span className="text-xs text-gray-600 w-10 text-right font-medium">
																{Math.round((statistics.databaseSites / statistics.totalSites) * 100)}%
															</span>
														</div>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-sm font-medium">{t("tools.statistics.infrastructure.none")}</span>
														<div className="flex items-center gap-2">
															<Badge variant="secondary" className="bg-gray-100 text-gray-800">{statistics.noneSites}</Badge>
															<span className="text-xs text-gray-600 w-10 text-right font-medium">
																{Math.round((statistics.noneSites / statistics.totalSites) * 100)}%
															</span>
														</div>
													</div>
												</div>
											</div>
											<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
												<h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
													<Zap className="size-4" />
													{t("tools.statistics.features.title")}
												</h4>
												<div className="space-y-3">
													<div className="flex justify-between items-center">
														<span className="text-sm font-medium">{t("tools.statistics.features.downloads")}</span>
														<div className="flex items-center">
															<Badge variant="secondary" className="bg-purple-100 text-purple-800">{statistics.sitesWithDownloadsProtection}</Badge>
															<span className="text-xs text-gray-600 w-10 text-right font-medium">
																{statistics.kubernetesSites > 0 ? Math.round((statistics.sitesWithDownloadsProtection / statistics.kubernetesSites) * 100) : 0}%
															</span>
														</div>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-sm font-medium">{t("tools.statistics.features.categories")}</span>
														<div className="flex items-center">
															<Badge variant="secondary" className="bg-orange-100 text-orange-800">{statistics.sitesWithCategories}</Badge>
															<span className="text-xs text-gray-600 w-10 text-right font-medium">
																{statistics.kubernetesSites > 0 ? Math.round((statistics.sitesWithCategories / statistics.kubernetesSites) * 100) : 0}%
															</span>
														</div>
													</div>
												</div>
											</div>
											<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
												<h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
													<Calendar className="size-4" />
													{t("tools.statistics.time.title")}
												</h4>
												<div className="space-y-3">
													<div className="flex justify-between items-center">
														<span className="text-sm font-medium">{t("tools.statistics.time.lastWeek")}</span>
														<Badge variant="secondary" className="bg-green-100 text-green-800">
															{sites.filter(site => moment(site.createdAt).isAfter(moment().subtract(7, "days"))).length}
														</Badge>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-sm font-medium">{t("tools.statistics.time.lastMonth")}</span>
														<Badge variant="secondary" className="bg-blue-100 text-blue-800">{statistics.recentSites}</Badge>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-sm font-medium">{t("tools.statistics.time.lastQuarter")}</span>
														<Badge variant="secondary" className="bg-purple-100 text-purple-800">
															{sites.filter(site => moment(site.createdAt).isAfter(moment().subtract(3, "months"))).length}
														</Badge>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div>
										<h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
											{t("tools.statistics.distributions.title")}
										</h3>
										<div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
											<div className="border border-gray-200 rounded-lg p-4">
												<h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
													<Layers className="size-4" />
													{t("tools.statistics.theme.distribution")}
												</h4>
												<div className="space-y-2">
													{statistics.themeStats.slice(0, 5).map((stat, index) => (
														<div key={index} className="flex justify-between items-center">
															<span className="text-sm truncate font-medium">{stat.name}</span>
															<div className="flex items-center gap-1">
																<Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{stat.count}</Badge>
																<span className="text-xs text-gray-500 w-8 text-right font-medium">{stat.percentage}%</span>
															</div>
														</div>
													))}
													{statistics.themeStats.length > 5 && (
														<div className="text-xs text-gray-500 text-center pt-1 italic">
															{t("tools.statistics.more", { count: statistics.themeStats.length - 5 })}
														</div>
													)}
												</div>
											</div>
											<div className="border border-gray-200 rounded-lg p-4">
												<h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
													<Languages className="size-4" />
													{t("tools.statistics.language.distribution")}
												</h4>
												<div className="space-y-2">
													{statistics.languageStats.slice(0, 5).map((stat, index) => (
														<div key={index} className="flex justify-between items-center">
															<span className="text-sm truncate font-medium">{stat.name}</span>
															<div className="flex items-center gap-1">
																<Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">{stat.count}</Badge>
																<span className="text-xs text-gray-500 w-8 text-right font-medium">{stat.percentage}%</span>
															</div>
														</div>
													))}
													{statistics.languageStats.length > 5 && (
														<div className="text-xs text-gray-500 text-center pt-1 italic">
															{t("tools.statistics.more", { count: statistics.languageStats.length - 5 })}
														</div>
													)}
												</div>
											</div>
											<div className="border border-gray-200 rounded-lg p-4">
												<h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
													<Tags className="size-4" />
													{t("tools.statistics.category.distribution")}
												</h4>
												<div className="space-y-2">
													{statistics.categoryStats.slice(0, 5).map((stat, index) => (
														<div key={index} className="flex justify-between items-center">
															<span className="text-sm truncate font-medium">{stat.name}</span>
															<div className="flex items-center gap-1">
																<Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">{stat.count}</Badge>
																<span className="text-xs text-gray-500 w-8 text-right font-medium">{stat.percentage}%</span>
															</div>
														</div>
													))}
													{statistics.categoryStats.length > 5 && (
														<div className="text-xs text-gray-500 text-center pt-1 italic">
															{t("tools.statistics.more", { count: statistics.categoryStats.length - 5 })}
														</div>
													)}
													{statistics.categoryStats.length === 0 && (
														<div className="text-xs text-gray-500 text-center py-4 italic">
															{t("tools.statistics.noData")}
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							</DialogContent>
						</Dialog>

						<Button className="h-10" asChild>
							<Link href="/new">
								<Plus className="size-5" />
								{t("actions.add")}
							</Link>
						</Button>
					</div>
				</div>
				<div className="flex gap-2 mt-6">
					<Input 
						onChange={(e) => updateFilters({ ...filters, url: e.target.value })} 
						value={filters.url} 
						placeholder={t("list.search.url.placeholder")} 
						className="flex-1 h-10" 
					/>

					<Select 
						onValueChange={(value) => updateFilters({ ...filters, infrastructure: value === "all" ? "" : value })} 
						value={filters.infrastructure || "all"}
					>
						<SelectTrigger className="w-64 !h-10">
							<SelectValue placeholder={t("list.search.infrastructure.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("list.search.infrastructure.all")}</SelectItem>
							{Object.values(INFRASTRUCTURES).map((infrastructure: InfrastructureType) => {
								return (
									<SelectItem key={infrastructure.NAME} value={infrastructure.NAME}>
										{infrastructure?.LABEL[locale as "fr" | "en"] || infrastructure.NAME}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>

					<Select 
						onValueChange={(value) => updateFilters({ ...filters, theme: value === "all" ? "" : value })} 
						value={filters.theme || "all"}
					>
						<SelectTrigger className="w-48 !h-10">
							<SelectValue placeholder={t("list.search.theme.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("list.search.theme.all")}</SelectItem>
							{Object.values(THEMES).map((theme: ThemeType) => (
								<SelectItem key={theme.NAME} value={theme.NAME}>
									{theme?.LABEL[locale as "fr" | "en"] || theme.NAME}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">
				<Table
					data={filteredSites}
					columns={columns}
					defaultSort={{
						key: "createdAt",
						direction: "desc",
					}}
				/>
			</div>
		</div>
	);
};
