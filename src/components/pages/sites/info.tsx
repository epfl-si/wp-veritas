"use client";
import React, { useEffect, useState, useCallback } from "react";
import { SearchSiteType } from "@/types/site";
import { GlobeIcon, Search, Loader2, AlertCircle, Calendar, Link as LinkIcon, Clock, ExternalLink, Shield, Users, Edit, User, Server, Database, Network } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import moment from "moment";
import "moment/locale/fr";
import { useDebouncedCallback } from "@/hooks/useDebounce";

interface SearchState {
	url: string;
}

interface SearchResponse {
	status: number;
	message: string;
	items?: SearchSiteType[];
}

export const SiteInfo: React.FC = () => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const [search, setSearch] = useState<SearchState>({
		url: searchParams.get("url") || "",
	});

	const [sites, setSites] = useState<SearchSiteType[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);

	const t = useTranslations("site");
	const locale = useLocale();

	useEffect(() => {
		moment.locale(locale);
	}, [locale]);

	useEffect(() => {
		const urlParam = searchParams.get("url");
		if (urlParam) {
			setSearch({ url: urlParam });

			searchSites({ url: urlParam });
		}
	}, [searchParams]);

	const updateURL = useCallback(
		(newUrl: string) => {
			const params = new URLSearchParams(searchParams);
			if (newUrl.trim()) {
				params.set("url", newUrl);
			} else {
				params.delete("url");
			}

			const newSearchParams = params.toString();
			const newPathname = newSearchParams ? `${pathname}?${newSearchParams}` : pathname;

			router.replace(newPathname, { scroll: false });
		},
		[searchParams, pathname, router],
	);

	const searchSites = useDebouncedCallback(
		async (searchParams: SearchState) => {
			if (!searchParams.url.trim()) {
				setSites([]);
				setHasSearched(false);
				return;
			}

			setLoading(true);
			setError(null);
			setHasSearched(true);

			try {
				const queryParams = new URLSearchParams();
				if (searchParams.url) queryParams.append("url", searchParams.url);

				const response = await fetch(`/api/sites/search?${queryParams.toString()}`);
				const data: SearchResponse = await response.json();

				if (response.ok && data.items) {
					setSites(data.items);
				} else {
					switch (data.status) {
						case 404:
							setError(t("info.error.notFound"));
							break;
						case 500:
							setError(t("info.error.server"));
							break;
						default:
							setError(data.message || t("info.error.server"));
							break;
					}
					setSites([]);
				}
			} catch (error) {
				console.error("Error fetching sites:", error);
				setError(t("error.connection"));
				setSites([]);
			} finally {
				setLoading(false);
			}
		},
		300,
	);

	const handleSearch = () => {
		updateURL(search.url);
		searchSites(search);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	const handleUrlChange = (value: string) => {
		setSearch({ ...search, url: value });
	};

	const SiteCard: React.FC<{ site: SearchSiteType }> = ({ site }) => (
		<Card className="w-full gap-2 border-l-4 border-l-blue-500">
			<CardHeader className="pb-0">
				<div className="flex items-start justify-between">
					<div className="space-y-2 flex-1">
						<div className="flex items-center gap-3">
							<div className="p-2 size-12 flex justify-center items-center bg-blue-100">
								<GlobeIcon className="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<CardTitle className="text-xl font-bold text-gray-900">{t("info.details.title")}</CardTitle>
								<CardDescription className="text-base -mt-1 text-gray-600">{t("info.details.description")}</CardDescription>
							</div>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="flex items-center gap-3">
					<div className="flex items-center w-full gap-3 p-3 bg-gray-50 rounded-lg">
						<LinkIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
						<a href={site.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 text-sm font-medium">
							{site.url}
							<ExternalLink className="w-4 h-4" />
						</a>
					</div>
					<div className="flex items-center w-full gap-3 p-3 bg-gray-50 rounded-lg">
						<LinkIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
						<a href={site.loginUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 text-sm font-medium">
							{site.loginUrl}
							<ExternalLink className="w-4 h-4" />
						</a>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="flex items-center gap-3">
						<div className="p-2 size-10 flex justify-center items-center bg-blue-100 rounded-lg">
							<Shield className="size-5 text-blue-700" />
						</div>
						<div>
							<div className="text-sm font-semibold text-gray-700">{t("info.details.loginUrl")}</div>
							<a href={site.loginUrl} target="_blank" rel="noopener noreferrer" className="mt-0 text-blue-600 hover:text-blue-800 underline text-sm inline-flex items-center gap-1">
								{t("info.details.adminAccess")}
								<ExternalLink className="w-3 h-3" strokeWidth={3} />
							</a>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="p-2 size-10 flex justify-center items-center bg-orange-100 rounded-lg">
							<Users className="size-5 text-orange-700" />
						</div>
						<div>
							<div className="text-sm font-semibold text-gray-700">{t("info.details.unit")}</div>
							<span className="flex items-center gap-1">
								<p className="text-sm font-medium text-gray-600">{site.unit.name}</p>
								<p className="text-xs text-gray-500">{site.unit.id}</p>
							</span>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="p-2 size-10 flex justify-center items-center bg-purple-100 rounded-lg">
							<Calendar className="size-5 text-purple-700" />
						</div>
						<div>
							<div className="text-sm font-medium text-gray-700">{t("info.details.lastModified")}</div>
							{site.lastModified ? (
								<div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
									<div className="flex items-center gap-0.5">
										<Clock className="size-4" strokeWidth={2} />
										<p className="text-sm leading-4 flex items-center h-4">{moment(site.lastModified.date).format("DD/MM/YYYY HH:mm")}</p>
									</div>
									<div className="flex items-center gap-0.5">
										<User className="size-4" strokeWidth={2} />
										<p className="text-sm leading-4 flex items-center h-4">{site.lastModified.user}</p>
									</div>
								</div>
							) : (
								<p className="text-sm text-gray-500">{t("info.details.neverModified")}</p>
							)}
						</div>
					</div>

					{site.infrastructure === "Kubernetes" && site.kubernetesExtraInfo && (
						<>
							<div className="flex items-center gap-3">
								<div className="p-2 size-10 flex justify-center items-center bg-green-100 rounded-lg">
									<Network className="size-5 text-green-700" />
								</div>
								<div>
									<div className="text-sm font-semibold text-gray-700">Ingress</div>
									<p className="text-sm font-medium text-gray-600">{site.kubernetesExtraInfo.ingressName || "N/A"}</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<div className="p-2 size-10 flex justify-center items-center bg-teal-100 rounded-lg">
									<Server className="size-5 text-teal-700" />
								</div>
								<div>
									<div className="text-sm font-semibold text-gray-700">Object name</div>
									<p className="text-sm font-medium text-gray-600">{site.kubernetesExtraInfo.wordpressSiteName || "N/A"}</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<div className="p-2 size-10 flex justify-center items-center bg-red-100 rounded-lg">
									<Database className="size-5 text-red-700" />
								</div>
								<div>
									<div className="text-sm font-semibold text-gray-700">Database</div>
									<p className="text-sm font-medium text-gray-600">{site.kubernetesExtraInfo.databaseRef || "N/A"}</p>
								</div>
							</div>
						</>
					)}
				</div>

				{site.recentModifications && site.recentModifications.length > 0 && (
					<div className="space-y-2">
						<div className="flex items-center gap-2 px-2">
							<Clock className="size-5 text-gray-500" />
							<span className="text-sm font-semibold text-gray-700">{t("info.details.recentModifications")}</span>
						</div>
						<div className="bg-gray-50 p-3 rounded-lg space-y-2 max-h-48 overflow-y-auto">
							{site.recentModifications.map((mod, index) => (
								<div key={index} className="flex items-start gap-2 text-xs">
									<span className="text-gray-400 mt-1">•</span>
									<div className="flex flex-wrap items-center gap-1">
										<Badge variant="outline" className="text-xs">
											{mod.user}
										</Badge>
										<span className="text-gray-600">{moment(mod.date).format("DD/MM HH:mm")}</span>
										{mod.available ? (
											<span className="text-gray-600">
												- <span className="font-medium">{mod.page}</span>
											</span>
										) : (
											<span className="text-gray-500 italic">- ({mod.page})</span>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				<Separator className="my-4" />

				<div className="space-y-4">
					<div className="flex items-center gap-2 px-2">
						<Shield className="size-5 text-blue-600" />
						<span className="text-sm font-semibold text-gray-700">{t("info.details.permissions")}</span>
					</div>

					<div className="w-full">
						<div className="p-3 bg-blue-50 rounded-lg">
							<div className="flex items-center gap-2 mb-2">
								<Edit className="w-4 h-4 text-blue-600" />
								<span className="text-sm font-medium text-blue-900">{t("info.details.editors")}</span>
								<Badge variant="outline" className="text-xs">
									{site.permissions.editors.length}
								</Badge>
							</div>
							<div className="flex flex-wrap gap-1">
								{site.permissions.editors.map((editor, index) => (
									<Badge key={index} variant="outline" className="text-xs">
										{editor.name}
									</Badge>
								))}
							</div>
						</div>
					</div>

					<div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
						<p className="text-xs text-yellow-800">
							<strong>{t("info.details.note")}:</strong> {t("info.details.permissionsNote")}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between h-10">
					<h1 className="text-3xl font-bold">{t("info.title")}</h1>
				</div>

				<div className="flex gap-2 mt-6">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input onChange={(e) => handleUrlChange(e.target.value)} onKeyPress={handleKeyPress} value={search.url} placeholder={t("info.search.url.placeholder")} className="pl-10 h-10" />
					</div>
					<Button onClick={handleSearch} className="h-10" disabled={!search.url.trim() || loading}>
						{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
						{t("info.search.button")}
					</Button>
				</div>
			</div>

			<div className="px-6 pb-6 h-full overflow-y-auto">
				{loading && (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-6 h-6 animate-spin mr-2" />
						<span>{t("info.loading")}</span>
					</div>
				)}

				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{!loading && !error && sites.length > 0 && sites[0].urlNotFound && (
					<Alert className="mb-4 border-yellow-500 bg-yellow-50">
						<AlertCircle className="h-4 w-4 text-yellow-600!" />
						<AlertDescription className="text-yellow-800">
							<strong>{t("info.urlNotFound.title")}</strong>
							<br />
							{t("info.urlNotFound.message")}
						</AlertDescription>
					</Alert>
				)}

				{!loading && !error && hasSearched && sites.length === 0 && (
					<Card className="text-center py-12">
						<CardContent className="pt-6">
							<GlobeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<CardTitle className="text-xl mb-2">{t("info.noResults.title")}</CardTitle>
							<CardDescription>{t("info.noResults.description")}</CardDescription>
						</CardContent>
					</Card>
				)}

				{!loading && !error && !hasSearched && (
					<Card className="text-center py-12">
						<CardContent className="pt-6">
							<Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<CardTitle className="text-xl mb-2">{t("info.searchPrompt.title")}</CardTitle>
							<CardDescription>{t("info.searchPrompt.description")}</CardDescription>
						</CardContent>
					</Card>
				)}

				{!loading && !error && sites.length > 0 && (
					<div className="space-y-6">
						<div className="grid gap-6">
							{sites.map((site) => (
								<SiteCard key={site.id} site={site} />
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
