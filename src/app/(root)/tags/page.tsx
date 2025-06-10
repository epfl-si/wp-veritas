'use server';

import { Error } from '@/components/error';
import { TagsList } from '@/components/pages/tags/list';
import { listTags } from '@/services/tags';
import { CircleX } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function TagsListPage() {
	const t = await getTranslations('tags.list');
	const { tags, error } = await listTags();

	if (error) {
		return <Error text={t('error.text')} subText={error.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!tags) {
		return <Error text={t('error.text')} subText={t('error.subText')} Icon={CircleX} color="text-red-500" />;
	}

	if (tags.length === 0) {
		return <Error text={t('error.empty')} subText="" Icon={CircleX} color="text-red-500" />;
	}

	return <TagsList tags={tags} />;
}
