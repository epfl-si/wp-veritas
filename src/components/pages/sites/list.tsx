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
import { Table, TableColumn } from '@/components/ui/table';

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

	const columns: TableColumn<SiteType>[] = [
		{
			key: 'url',
			label: 'Titre',
			width: 'w-full',
			align: 'left',
			render: (site) => (
				<a href={site.url} className="flex items-center gap-2 font-medium text-blue-600 hover:underline group" target="_blank" rel="noopener noreferrer">
					<GlobeIcon className="size-5 flex-shrink-0" />
					<span className="text-sm font-medium truncate">{site.url}</span>
				</a>
			),
		},
		{
			key: 'type',
			label: 'Type',
			width: 'w-80',
			align: 'center',
			render: (site) => {
				const typeConfig = getTypeConfig(site.type);
				return (
					<div className="text-black p-2 h-8 flex gap-1.5 justify-center items-center">
						{typeConfig?.ICON && <typeConfig.ICON className="size-4" />}
						<span className="text-sm font-semibold uppercase">{site.type}</span>
					</div>
				);
			},
		},
		{
			key: 'actions',
			label: 'Actions',
			width: 'w-80',
			align: 'left',
			render: (site) => (
				<div className="flex gap-1 items-center">
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
			),
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			{/* Section de recherche */}
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

			{/* Table avec données filtrées */}
			<div className="px-6 pb-0">
				<Table data={filteredSites} columns={columns} />
			</div>
		</div>
	);
};
