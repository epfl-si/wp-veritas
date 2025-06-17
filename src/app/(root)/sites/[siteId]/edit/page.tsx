'use server';
import { Error } from '@/components/error';
import { SiteUpdate } from '@/components/pages/sites/update';
import { getSite } from '@/services/site';
import { CircleX } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function SiteUpdatePage({
	params,
}: {
	params: Promise<{
		siteId: string;
	}>;
}) {
	const t = await getTranslations('tag.update');
	const { siteId } = await params;

	const { site, error } = await getSite(siteId);

	if (error) {
		return <Error text={t('error.text')} subText={error.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!site) {
		return <Error text={t('error.empty')} subText={t('error.subText')} Icon={CircleX} color="text-red-500" />;
	}

	return <SiteUpdate site={site} />;
}
