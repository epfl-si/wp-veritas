'use client';
import React, { Fragment, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableColumn } from '@/components/ui/table';
import moment from 'moment';
import 'moment/locale/fr';
import { LogType } from '@/types/log';
import { LOG_LEVELS } from '@/constants/logs';
import { UserRound } from 'lucide-react';

const getLogLevelConfig = (level: string) => {
	return Object.values(LOG_LEVELS).find((config) => config.NAME.toLowerCase() === level.toLowerCase());
};

const logLevels = Object.values(LOG_LEVELS).map((level) => level.NAME.toLowerCase());

export const LogsList: React.FC<{ logs: LogType[] }> = ({ logs }) => {
	const [search, setSearch] = useState({
		message: '',
		level: '',
	});

	const t = useTranslations('logs');
	const locale = useLocale();

	const filteredLogs = logs.filter((log) => {
		const matchesMessage = log.message.toLowerCase().includes(search.message.toLowerCase());
		const matchesLevel = search.level === '' || log.level === search.level;
		return matchesMessage && matchesLevel;
	});

	const columns: TableColumn<LogType>[] = [
		{
			key: 'timestamp',
			label: 'Date/Heure',
			width: 'w-40',
			align: 'left',
			sortable: true,
			render: (log) => (
				<div className="text-sm font-medium" title={moment(log.timestamp).locale(locale).format('LLLL')}>
					{moment(log.timestamp).locale(locale).format('DD/MM/YYYY HH:mm:ss')}
				</div>
			),
		},
		{
			key: 'level',
			label: 'Niveau',
			width: 'w-32',
			align: 'left',
			sortable: true,
			render: (log) => {
				const levelConfig = getLogLevelConfig(log.level);
				return (
					<div className="text-black p-2 h-9 flex gap-1 justify-center items-center border-2" style={{ borderColor: levelConfig?.COLOR, color: levelConfig?.COLOR }}>
						{levelConfig?.ICON ? React.createElement(levelConfig.ICON, { className: 'size-4', strokeWidth: 2.3 }) : null}
						<span className="text-sm font-semibold uppercase">{levelConfig?.LABEL[locale as 'fr' | 'en'] || log.level}</span>
						{log.level}
					</div>
				);
			},
		},
		{
			key: 'message',
			label: 'Message',
			width: 'flex-1',
			align: 'left',
			sortable: true,
			render: (log) => (
				<div className="text-sm truncate max-w-md" title={log.message}>
					{log.message}
				</div>
			),
		},
		{
			key: 'userId',
			label: 'Utilisateur',
			width: 'w-32',
			align: 'left',
			sortable: true,
			render: (log) => (
				<div className="text-sm text-gray-600 flex items-center gap-1" title={log.userId || '-'}>
					{log.userId ? (
						<Fragment>
							<UserRound className="size-4" />
							<p className="truncate">{log.userId}</p>
						</Fragment>
					) : (
						<span className="italic">-</span>
					)}
				</div>
			),
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">{t('list.title')}</h1>
				</div>
				<div className="flex gap-2 mt-6">
					<Input onChange={(e) => setSearch({ ...search, message: e.target.value })} value={search.message} placeholder={t('list.search.message.placeholder')} className="flex-1 h-10" />
					<Select onValueChange={(value) => setSearch({ ...search, level: value === 'all' ? '' : value })} value={search.level || 'all'}>
						<SelectTrigger className="w-48 !h-10">
							<SelectValue placeholder={t('list.search.level.placeholder')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t('list.search.level.all')}</SelectItem>
							{logLevels.map((levelName: string) => {
								const levelConfig = getLogLevelConfig(levelName);
								return (
									<SelectItem key={levelName} value={levelName}>
										{levelConfig?.LABEL[locale as 'fr' | 'en'] || levelName}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">
				<Table data={filteredLogs} columns={columns} defaultSort={{ key: 'timestamp', direction: 'desc' }} />
			</div>
		</div>
	);
};
