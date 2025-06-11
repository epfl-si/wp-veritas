'use client';
import React, { useEffect, useState } from 'react';
import { SiteType } from '@/types/site';
import { FileText, GlobeIcon, Info, Pencil, Plus, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TYPES } from '@/constants/types';
import { Table, TableColumn } from '@/components/ui/table';
import moment from 'moment';
import 'moment/locale/fr';
import { PERMISSIONS } from '@/constants/permissions';
import { THEMES } from '@/constants/theme';
import { ThemeType } from '@/types/theme';
import { TypeType } from '@/types/type';
import { DeleteDialog } from '@/components/dialog/delete';

export const SiteList: React.FC<{ sites: SiteType[]; permissions: string[] }> = ({ sites, permissions }) => {
	const [search, setSearch] = useState({
		url: '',
		type: '',
		theme: '',
	});

	const t = useTranslations('site');
	const locale = useLocale();

	useEffect(() => {
		moment.locale(locale);
	}, [locale]);

	const getTypeConfig = (typeName: string) => {
		return Object.values(TYPES).find((type) => type.NAME === typeName);
	};

	const formatRelativeDate = (date: Date) => {
		const relative = moment(date).fromNow();
		return relative.charAt(0).toUpperCase() + relative.slice(1);
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
			label: t('list.column.url'),
			width: 'min-w-0 flex-1',
			align: 'left',
			sortable: true,
			render: (site) => (
				<a href={site.url} className="flex items-center gap-2 font-medium text-blue-600 hover:underline group" target="_blank" rel="noopener noreferrer">
					<GlobeIcon className="size-6 flex-shrink-0" />
					<span className="text-base font-medium truncate">{site.url}</span>
				</a>
			),
		},
		{
			key: 'type',
			label: t('list.column.type'),
			width: 'w-48',
			align: 'center',
			sortable: true,
			render: (site) => {
				const typeConfig = getTypeConfig(site.type);
				return (
					<div className="text-black p-2 h-9 flex gap-1 justify-center items-center border-2" style={{ borderColor: typeConfig?.COLOR, color: typeConfig?.COLOR }}>
						{typeConfig?.ICON ? React.createElement(typeConfig.ICON, { className: 'size-4', strokeWidth: 2.3 }) : null}
						<span className="text-sm font-semibold uppercase">{site.type}</span>
					</div>
				);
			},
		},
		{
			key: 'createdAt',
			label: t('list.column.createdAt'),
			width: 'w-48',
			align: 'center',
			sortable: true,
			sortKey: 'createdAt',
			render: (site) => (
				<div className="text-center">
					<p className="text-sm font-medium text-gray-700">{formatRelativeDate(site.createdAt)}</p>
				</div>
			),
		},
		{
			key: 'actions',
			label: t('list.column.actions'),
			width: 'w-60',
			align: 'left',
			sortable: false,
			render: (site) => (
				<div className="flex gap-1.5 items-center py-1">
					{permissions.includes(PERMISSIONS.SITES.INFO) && (
						<Button variant="outline" className="p-1 w-9 h-9 border-2 border-green-500 text-green-500 hover:text-white hover:bg-green-500" asChild>
							<Link href={`/info?url=${site.url}`}>
								<Info strokeWidth={2.3} className="size-5" />
							</Link>
						</Button>
					)}

					{permissions.includes(PERMISSIONS.SITES.READ) && (
						<Button variant="outline" className="p-1 w-9 h-9 border-2 border-green-500 text-green-500 hover:text-white hover:bg-green-500">
							<FileText strokeWidth={2.3} className="size-5" />
						</Button>
					)}

					{permissions.includes(PERMISSIONS.SITES.UPDATE) && (
						<Button variant="outline" className="p-1 w-9 h-9 border-2 border-blue-500 text-blue-500 hover:text-white hover:bg-blue-500" asChild>
							<Link href={`/edit/${site.id}`}>
								<Pencil strokeWidth={2.3} className="size-5" />
							</Link>
						</Button>
					)}

					{permissions.includes(PERMISSIONS.TAGS.ASSOCIATE) && (
						<Button variant="outline" className="p-1 w-9 h-9 border-2 border-blue-500 text-blue-500 hover:text-white hover:bg-blue-500" asChild>
							<Link href={`/site-tags/${site.id}`}>
								<Tags strokeWidth={2.3} className="size-5" />
							</Link>
						</Button>
					)}

					{permissions.includes(PERMISSIONS.SITES.DELETE) && <DeleteDialog icon={GlobeIcon} displayName={site.url} type="site" apiEndpoint={`/api/sites/${site.id}`} />}
				</div>
			),
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">{t('list.title')}</h1>
					<Button className="h-10" asChild>
						<Link href="/site/add">
							<Plus className="size-5" />
							{t('actions.add')}
						</Link>
					</Button>
				</div>
				<div className="flex gap-2 mt-6">
					<Input onChange={(e) => setSearch({ ...search, url: e.target.value })} value={search.url} placeholder={t('list.search.url.placeholder')} className="flex-1 h-10" />

					<Select onValueChange={(value) => setSearch({ ...search, type: value === 'all' ? '' : value })} value={search.type || 'all'}>
						<SelectTrigger className="w-48 !h-10">
							<SelectValue placeholder={t('list.search.type.placeholder')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t('list.search.type.all')}</SelectItem>
							{Object.values(TYPES).map((type: TypeType) => {
								return (
									<SelectItem key={type.NAME} value={type.NAME}>
										{type?.LABEL[locale as 'fr' | 'en'] || type.NAME}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>

					<Select onValueChange={(value) => setSearch({ ...search, theme: value === 'all' ? '' : value })} value={search.theme || 'all'}>
						<SelectTrigger className="w-48 !h-10">
							<SelectValue placeholder={t('list.search.theme.placeholder')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t('list.search.theme.all')}</SelectItem>
							{Object.values(THEMES).map((theme: ThemeType) => (
								<SelectItem key={theme.NAME} value={theme.NAME}>
									{theme?.LABEL[locale as 'fr' | 'en'] || theme.NAME}
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
						key: 'createdAt',
						direction: 'desc',
					}}
				/>
			</div>
		</div>
	);
};
