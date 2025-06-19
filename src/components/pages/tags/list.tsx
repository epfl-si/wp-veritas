'use client';
import React, { useEffect, useState } from 'react';
import { Pencil, Plus, TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableColumn } from '@/components/ui/table';
import moment from 'moment';
import 'moment/locale/fr';
import { TagCategoryType, TagType } from '@/types/tag';
import { PERMISSIONS } from '@/constants/permissions';
import { DeleteDialog } from '@/components/dialog/delete';
import { TAG_CATEGORIES } from '@/constants/tags';

export const TagList: React.FC<{ tags: TagType[]; permissions: string[] }> = ({ tags, permissions }) => {
	const [search, setSearch] = useState({
		name: '',
		type: '',
	});

	const t = useTranslations('tag');
	const locale = useLocale();

	useEffect(() => {
		moment.locale(locale);
	}, [locale]);

	const getTypeConfig = (typeName: string) => {
		return Object.values(TAG_CATEGORIES).find((type) => type.NAME === typeName);
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
			width: 'w-[30%]',
			align: 'left',
			sortable: true,
			render: (tag) => (
				<div className="text-base font-medium leading-relaxed" title={tag.nameEn}>
					{tag.nameEn}
				</div>
			),
		},
		{
			key: 'nameFr',
			label: 'Nom (FR)',
			width: 'w-[30%]',
			align: 'left',
			sortable: true,
			render: (tag) => (
				<div className="text-base font-medium leading-relaxed" title={tag.nameFr}>
					{tag.nameFr}
				</div>
			),
		},
		{
			key: 'type',
			label: 'Type',
			width: 'w-[15%]',
			align: 'left',
			sortable: true,
			render: (tag) => {
				const typeConfig = getTypeConfig(tag.type);
				return (
					<div className="flex items-center gap-2" title={typeConfig?.LABEL[locale as 'fr' | 'en'] || tag.type}>
						{typeConfig?.LABEL[locale as 'fr' | 'en'] || tag.type}
					</div>
				);
			},
		},
		{
			key: 'actions',
			label: 'Actions',
			width: 'w-[10%]',
			align: 'left',
			sortable: false,
			render: (tag) => (
				<div className="flex gap-1.5 items-center py-1">
					{permissions.includes(PERMISSIONS.TAGS.UPDATE) && (
						<Button variant="outline" className="p-1 w-9 h-9 border-2 border-gray-200 text-gray-600 hover:text-gray-600 hover:bg-gray-200" asChild>
							<Link href={`/tags/${tag.id}/edit`}>
								<Pencil strokeWidth={2.3} className="size-5" />
							</Link>
						</Button>
					)}

					{permissions.includes(PERMISSIONS.SITES.DELETE) && <DeleteDialog icon={TagIcon} displayName={locale === 'fr' ? tag.nameFr : tag.nameEn} type="tag" apiEndpoint={`/api/tags/${tag.id}`} />}
				</div>
			),
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">{t('list.title')}</h1>
					{permissions.includes(PERMISSIONS.TAGS.CREATE) && (
						<Button className="h-10" asChild>
							<Link href="/tags/add">
								<Plus className="size-5" />
								{t('actions.add')}
							</Link>
						</Button>
					)}
				</div>
				<div className="flex gap-2 mt-6">
					<Input onChange={(e) => setSearch({ ...search, name: e.target.value })} value={search.name} placeholder={t('list.search.name.placeholder')} className="flex-1 h-10" />
					<Select onValueChange={(value) => setSearch({ ...search, type: value === 'all' ? '' : value })} value={search.type || 'all'}>
						<SelectTrigger className="w-48 !h-10">
							<SelectValue placeholder={t('list.search.type.placeholder')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t('list.search.type.all')}</SelectItem>
							{Object.values(TAG_CATEGORIES).map((type: TagCategoryType) => {
								return (
									<SelectItem key={type.NAME} value={type.NAME}>
										{type?.LABEL[locale as 'fr' | 'en'] || type.NAME}
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
