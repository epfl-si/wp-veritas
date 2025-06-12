'use server';
import { Error } from '@/components/error';
import { TagUpdate } from '@/components/pages/tags/update';
import { getTag } from '@/services/tags';
import { CircleX } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function TagUpdatePage({
	params,
}: {
	params: {
		tagId: string;
	};
}) {
	const t = await getTranslations('tag.update');
	const { tagId } = await params;

	const { tag, error } = await getTag(tagId);

	if (error) {
		return <Error text={t('error.text')} subText={error.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!tag) {
		return <Error text={t('error.empty')} subText={t('error.subText')} Icon={CircleX} color="text-red-500" />;
	}

	return <TagUpdate tag={tag} />;
}
