'use client';
import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Table, TableColumn } from '@/components/ui/table';
import { ThemeType } from '@/types/theme';

export const ThemeList: React.FC<{ themes: ThemeType[] }> = ({ themes }) => {
	const [search, setSearch] = useState({
		name: '',
	});

	const t = useTranslations('theme');
	const locale = useLocale();

	const columns: TableColumn<ThemeType>[] = [
		{
			key: 'name',
			label: t('list.column.name'),
			width: 'flex-1',
			align: 'left',
			render: (theme) => (
				<div className="text-base font-medium truncate" title={theme.NAME}>
					{theme?.LABEL[locale as 'fr' | 'en'] || theme.NAME}
				</div>
			),
		},
	];

	const filteredThemes = themes.filter((theme) => {
		const matchesName = theme.NAME.toLowerCase().includes(search.name.toLowerCase());
		const matchesLabel = theme.LABEL[locale as 'fr' | 'en']?.toLowerCase().includes(search.name.toLowerCase());
		return matchesName || matchesLabel;
	});

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">{t('list.title')}</h1>
				</div>
				<div className="flex gap-2 mt-6">
					<Input onChange={(e) => setSearch({ ...search, name: e.target.value })} value={search.name} placeholder={t('list.search.name.placeholder')} className="flex-1 h-10" />
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">
				<Table data={filteredThemes} columns={columns} />
			</div>
		</div>
	);
};
