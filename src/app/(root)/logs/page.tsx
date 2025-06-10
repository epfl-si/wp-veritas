'use server';

import { Error } from '@/components/error';
import { LogsList } from '@/components/pages/logs/list';
import { listLogs } from '@/services/logs';
import { CircleX } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function LogsListPage() {
	const t = await getTranslations('logs.list');
	const { logs, error } = await listLogs();

	if (error) {
		return <Error text={t('error.text')} subText={error.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!logs) {
		return <Error text={t('error.text')} subText={t('error.subText')} Icon={CircleX} color="text-red-500" />;
	}

	if (logs.length === 0) {
		return <Error text={t('error.empty')} subText="" Icon={CircleX} color="text-red-500" />;
	}

	return <LogsList logs={logs} />;
}
