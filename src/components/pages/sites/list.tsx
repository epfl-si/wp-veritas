'use client';
import React, { useState } from 'react';
import { SiteType } from '@/types/site';
import { FileText, GlobeIcon, Info, Pencil, Tags, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TYPES } from '@/constants/types';

export const SitesList: React.FC<{ sites: SiteType[] }> = ({ sites }) => {
	const [search, setSearch] = useState({
		url: '',
		type: '',
		theme: '',
	});

	const t = useTranslations('sites.list');
	const locale = useLocale();

	const siteTypes = Array.from(new Set(sites.map((site) => site.type))).sort();
	const siteThemes = Array.from(new Set(sites.map((site) => site.theme))).sort();

	const getTypeConfig = (typeName: string) => {
		return Object.values(TYPES).find((type) => type.NAME === typeName);
	};

	const filteredSites = sites.filter((site) => {
		const matchesUrl = site.url.toLowerCase().includes(search.url.toLowerCase());
		const matchesType = search.type === '' || site.type === search.type;
		const matchesTheme = search.theme === '' || site.theme === search.theme;
		return matchesUrl && matchesType && matchesTheme;
	});

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<h1 className="text-3xl font-bold">{t('title')}</h1>
				<div className="flex gap-2 mt-6">
					<Input onChange={(e) => setSearch({ ...search, url: e.target.value })} value={search.url} placeholder={t('search.url.placeholder')} className="flex-1 h-10" />

					<Select onValueChange={(value) => setSearch({ ...search, type: value === 'all' ? '' : value })} value={search.type || 'all'}>
						<SelectTrigger className="w-48 !h-10">
							<SelectValue placeholder={t('search.type.placeholder')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t('search.type.all')}</SelectItem>
							{siteTypes.map((typeName: string) => {
								const typeConfig = getTypeConfig(typeName);
								return (
									<SelectItem key={typeName} value={typeName}>
										{typeConfig?.LABEL[locale as 'fr' | 'en'] || typeName}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>

					<Select onValueChange={(value) => setSearch({ ...search, theme: value === 'all' ? '' : value })} value={search.theme || 'all'}>
						<SelectTrigger className="w-48 !h-10">
							<SelectValue placeholder={t('search.theme.placeholder')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t('search.theme.all')}</SelectItem>
							{siteThemes.map((theme: string) => (
								<SelectItem key={theme} value={theme}>
									{theme}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex-1 px-6 pb-0 overflow-hidden">
				<div className="h-full flex flex-col">
					<div className="flex-shrink-0 border-b">
						<table className="min-w-full">
							<thead>
								<tr>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Titre
									</th>
									<th scope="col" className="px-6 py-3 w-80 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Type
									</th>
									<th scope="col" className="px-6 py-3 w-80 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
						</table>
					</div>
					<div className="flex-1 overflow-y-auto">
						<table className="min-w-full mb-4">
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredSites.map((site) => {
									const typeConfig = getTypeConfig(site.type);
									return (
										<tr key={site.id} className="hover:bg-gray-50 transition-colors duration-150">
											<td className="px-6 py-4 w-full">
												<a href={site.url} className="flex items-center gap-2 font-medium text-blue-600 hover:underline group" target="_blank" rel="noopener noreferrer">
													<GlobeIcon className="size-5 flex-shrink-0" />
													<span className="text-sm font-medium truncate">{site.url}</span>
												</a>
											</td>
											<td className="px-6 py-4 w-80 flex justify-center items-center">
												<div className="text-black p-2 h-8 flex gap-1.5 justify-center items-center">
													{typeConfig?.ICON && <typeConfig.ICON className="size-5" />}
													<span className="text-sm font-semibold uppercase">{site.type}</span>
												</div>
											</td>
											<td className="px-6 py-3.5 w-80">
												<div className="flex gap-2 items-center">
													<Button variant="outline" size="sm" className="p-1 w-8 h-8" asChild>
														<Link href={`/info?s=${site.url}`}>
															<Info className="size-4" />
														</Link>
													</Button>

													<Button variant="outline" size="sm" className="p-1 w-8 h-8">
														<FileText className="size-4" />
													</Button>

													<Button variant="outline" size="sm" className="p-1 w-8 h-8" asChild>
														<Link href={`/edit/${site.id}`}>
															<Pencil className="size-4" />
														</Link>
													</Button>

													<Button variant="outline" size="sm" className="p-1 w-8 h-8" asChild>
														<Link href={`/site-tags/${site.id}`}>
															<Tags className="size-4" />
														</Link>
													</Button>

													<Button variant="outline" size="sm" className="p-1 w-8 h-8">
														<GlobeIcon className="size-4" />
													</Button>

													<Button variant="destructive" size="sm" className="p-1 w-8 h-8">
														<Trash2 className="size-4" />
													</Button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};
