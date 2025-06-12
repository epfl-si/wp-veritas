'use client';
import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TAG_TYPES } from '@/constants/tags';
import Form, { FormConfig, FieldConfig, SectionConfig } from '@/components/form';
import { tagSchema, TagFormType, TagEnumType, TagType } from '@/types/tag';
import { useZodErrorMessages } from '@/hooks/zod';

interface TagUpdateProps {
	tag: TagType;
}

export const TagUpdate: React.FC<TagUpdateProps> = ({ tag }) => {
	const t = useTranslations('tag');
	const locale = useLocale();
	const errorMessages = useZodErrorMessages();

	const getFormConfig = (): FormConfig<TagFormType> => {
		const fields: FieldConfig[] = [
			{
				name: 'type',
				type: 'boxes',
				label: t('form.type.label'),
				section: 'general',
				width: 'full',
				options: Object.values(TAG_TYPES).map((type) => ({
					value: type.NAME,
					label: type.LABEL[locale as 'fr' | 'en'] || type.NAME,
					color: type.COLOR,
					icon: type.ICON,
				})),
			},
			{
				name: 'nameFr',
				type: 'text',
				label: t('form.nameFr.label'),
				placeholder: t('form.nameFr.placeholder'),
				section: 'names',
				width: 'half',
			},
			{
				name: 'nameEn',
				type: 'text',
				label: t('form.nameEn.label'),
				placeholder: t('form.nameEn.placeholder'),
				section: 'names',
				width: 'half',
			},
			{
				name: 'urlFr',
				type: 'text',
				label: t('form.urlFr.label'),
				placeholder: t('form.urlFr.placeholder'),
				section: 'names',
				width: 'full',
			},
			{
				name: 'urlEn',
				type: 'text',
				label: t('form.urlEn.label'),
				placeholder: t('form.urlEn.placeholder'),
				section: 'names',
				width: 'full',
			},
		];

		const sections: SectionConfig[] = [
			{
				name: 'general',
				title: t('form.sections.general.title'),
				columns: 1,
			},
			{
				name: 'names',
				title: t('form.sections.names.title'),
				columns: 2,
			},
		];

		return {
			schema: tagSchema(errorMessages),
			fields,
			sections,
			defaultValues: {
				type: (tag.type || '') as TagEnumType,
				nameFr: tag.nameFr || '',
				nameEn: tag.nameEn || '',
				urlFr: tag.urlFr || '',
				urlEn: tag.urlEn || '',
			},
			apiEndpoint: `/api/tags/${tag.id}`,
			method: 'PUT',
			reset: false,
			submitButtonText: t('actions.update'),
			resetButtonText: t('actions.reset'),
			loadingText: t('actions.updating'),
			successTitle: t('update.success.title'),
			successMessage: t('update.success.message'),
			errorMessage: t('update.error.title'),
			onSuccess: () => {},
			onError: (error) => {
				console.error('Error updating tag:', error);
			},
		};
	};

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between h-10">
					<h1 className="text-3xl font-bold">{t('update.title')}</h1>
				</div>
			</div>
			<div className="px-6 pb-0 h-full overflow-y-auto">
				<Form config={getFormConfig()} />
			</div>
		</div>
	);
};
