'use client';
import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableColumn } from '@/components/ui/table';
import moment from 'moment';
import 'moment/locale/fr';
import { TagType } from '@/types/tags';
import { TAG_TYPES } from '@/constants/tags';

export const TagsList: React.FC<{ tags: TagType[] }> = ({ tags }) => {
	const [search, setSearch] = useState({
		name: '',
		type: '',
	});

	const t = useTranslations('tags.list');
	const locale = useLocale();

	useEffect(() => {
		moment.locale(locale);
	}, [locale]);

	const tagsTypes = Object.values(TAG_TYPES).map((tag) => tag.NAME) as string[];

	const getTypeConfig = (typeName: string) => {
		return Object.values(TAG_TYPES).find((type) => type.NAME === typeName);
	};

	const filteredTags = tags.filter((tag) => {
		const matchesName = tag.nameFr.toLowerCase().includes(search.name.toLowerCase()) || tag.nameEn.toLowerCase().includes(search.name.toLowerCase());
		const matchesType = search.type === '' || tag.type === search.type;
		return matchesName && matchesType;
	});

	const columns: TableColumn<TagType>[] = [
		{
			key: 'nameEn',
			label: 'Nom (EN)',
			width: 'w-32',
			align: 'left',
			sortable: true,
			render: (tag) => <span className="text-base font-medium truncate">{tag.nameEn}</span>,
		},
		{
			key: 'nameFr',
			label: 'Nom (FR)',
			width: 'w-32',
			align: 'left',
			sortable: true,
			render: (tag) => <span className="text-base font-medium truncate">{tag.nameFr}</span>,
		},
		{
			key: 'type',
			label: 'Type',
			width: 'w-32',
			align: 'left',
			sortable: true,
			render: (tag) => <span className="text-base font-medium truncate">{tag.type}</span>,
		},
		{
			key: 'urlEn',
			label: 'URL (EN)',
			width: 'w-32',
			align: 'left',
			sortable: true,
			render: (tag) => (
				<span className="text-base font-medium truncate">
					<Link href={tag.urlEn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
						{tag.urlEn}
					</Link>
				</span>
			),
		},
		{
			key: 'urlFr',
			label: 'URL (FR)',
			width: 'w-32',
			align: 'left',
			sortable: true,
			render: (tag) => (
				<span className="text-base font-medium truncate">
					<Link href={tag.urlFr} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
						{tag.urlFr}
					</Link>
				</span>
			),
		},
		{
			key: 'actions',
			label: 'Actions',
			width: 'w-32',
			align: 'left',
			sortable: false,
			render: (tag) => (
				<div className="flex gap-1.5 items-center py-1">
					<Button variant="outline" className="p-1 w-9 h-9 border-2 border-blue-500 text-blue-500 hover:text-white hover:bg-blue-500" asChild>
						<Link href={`/tag/edit/${tag.id}`}>
							<Pencil strokeWidth={2.3} className="size-5" />
						</Link>
					</Button>

					<Button variant="outline" className="p-1 w-9 h-9 border-2 border-red-500 text-red-500 hover:text-white hover:bg-red-500">
						<Trash2 strokeWidth={2.3} className="size-5" />
					</Button>
				</div>
			),
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">{t('title')}</h1>
					<Button className="h-10" asChild>
						<Link href="/tag/add">
							<Plus className="size-5" />
							{t('actions.add')}
						</Link>
					</Button>
				</div>
				<div className="flex gap-2 mt-6">
					<Input onChange={(e) => setSearch({ ...search, name: e.target.value })} value={search.name} placeholder={t('search.name.placeholder')} className="flex-1 h-10" />
					<Select onValueChange={(value) => setSearch({ ...search, type: value === 'all' ? '' : value })} value={search.type || 'all'}>
						<SelectTrigger className="w-48 !h-10">
							<SelectValue placeholder={t('search.type.placeholder')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t('search.type.all')}</SelectItem>
							{tagsTypes.map((typeName: string) => {
								const typeConfig = getTypeConfig(typeName);
								return (
									<SelectItem key={typeName} value={typeName}>
										{typeConfig?.LABEL[locale as 'fr' | 'en'] || typeName}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">
				<Table data={filteredTags} columns={columns} />
			</div>
		</div>
	);
};
