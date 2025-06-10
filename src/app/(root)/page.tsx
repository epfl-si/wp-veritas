'use server';

import { Error } from '@/components/error';
import { SitesList } from '@/components/pages/sites/list';
import { getUserPermissions } from '@/services/auth';
import { listSites } from '@/services/site';
import { CircleX } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function SitesListPage() {
	const t = await getTranslations('sites.list');
	const { sites, error } = await listSites();

	const permissions = await getUserPermissions();

	if (error) {
		return <Error text={t('error.text')} subText={error.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!sites) {
		return <Error text={t('error.text')} subText={t('error.subText')} Icon={CircleX} color="text-red-500" />;
	}

	if (sites.length === 0) {
		return <Error text={t('error.empty')} subText="" Icon={CircleX} color="text-red-500" />;
	}

	return <SitesList sites={sites} permissions={permissions} />;
}
