'use client';
import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Form, { FormConfig, FieldConfig, SectionConfig } from '@/components/form';
import { SiteFormType, siteSchema } from '@/types/site';
import { useZodErrorMessages } from '@/hooks/zod';
import { INFRASTRUCTURES } from '@/constants/infrastructures';
import { THEMES } from '@/constants/theme';

export const SiteAdd: React.FC = () => {
	const t = useTranslations('site');
	const locale = useLocale();
	const errorMessages = useZodErrorMessages();

	const getFormConfig = (): FormConfig<SiteFormType> => {
		const fields: FieldConfig[] = [
			{
				name: 'infrastructure',
				type: 'boxes',
				label: t('form.infrastructure.label'),
				section: 'general',
				width: 'full',
				options: Object.values(INFRASTRUCTURES)
					.filter((infrastructures) => infrastructures.CREATED)
					.map((infrastructure) => ({
						value: infrastructure.NAME,
						label: infrastructure.LABEL[locale as 'fr' | 'en'] || infrastructure.NAME,
						color: infrastructure.COLOR,
						icon: infrastructure.ICON,
					})),
			},
			{
				name: 'url',
				type: 'text',
				label: t('form.url.label'),
				placeholder: t('form.url.placeholder'),
				section: 'general',
				width: 'full',
			},
			{
				name: 'title',
				type: 'text',
				label: t('form.title.label'),
				placeholder: t('form.title.placeholder'),
				section: 'details',
				width: 'half',
				conditions: [
					{
						field: 'infrastructure',
						operator: 'equals',
						value: 'Kubernetes',
						type: 'display',
					},
				],
			},
			{
				name: 'tagline',
				type: 'text',
				label: t('form.tagline.label'),
				placeholder: t('form.tagline.placeholder'),
				section: 'details',
				width: 'half',
				conditions: [
					{
						field: 'infrastructure',
						operator: 'equals',
						value: 'Kubernetes',
						type: 'display',
					},
				],
			},
			{
				name: 'theme',
				type: 'select',
				label: t('form.theme.label'),
				placeholder: t('form.theme.placeholder'),
				section: 'details',
				options: Object.values(THEMES).map((theme) => ({
					value: theme.NAME,
					label: theme.LABEL[locale as 'fr' | 'en'] || theme.NAME,
				})),
				width: 'full',
				conditions: [
					{
						field: 'infrastructure',
						operator: 'equals',
						value: 'Kubernetes',
						type: 'display',
					},
					{
						field: 'url',
						operator: 'regex',
						value: '^https?://(?!(?:inside|www|wpn-test)[.])([a-zA-Z0-9-]+[.])*[a-zA-Z0-9-]+[.]epfl[.]ch(/.*)?$',
						type: 'default',
						defaultValue: 'wp-theme-light',
					},
					{
						field: 'url',
						operator: 'regex',
						value: '^https?://(?!(?:inside|www|wpn-test)[.])([a-zA-Z0-9-]+[.])*[a-zA-Z0-9-]+[.]epfl[.]ch(/.*)?$',
						type: 'disabled',
					},
				],
			},
			{
				name: 'unitId',
				type: 'number',
				label: t('form.unitId.label'),
				placeholder: t('form.unitId.placeholder'),
				section: 'details',
				width: 'half',
			},
			{
				name: 'languages',
				type: 'multiselect',
				label: t('form.languages.label'),
				section: 'details',
				width: 'half',
				options: [
					{ value: 'fr', label: 'Français' },
					{ value: 'en', label: 'English' },
					{ value: 'de', label: 'Deutsch' },
					{ value: 'es', label: 'Español' },
				],
				conditions: [
					{
						field: 'infrastructure',
						operator: 'equals',
						value: 'Kubernetes',
						type: 'display',
					},
				],
			},
			{
				name: 'categories',
				type: 'multiselect',
				label: t('form.categories.label'),
				section: 'details',
				width: 'full',
				options: [
					{ value: 'education', label: t('form.categories.options.education') },
					{ value: 'business', label: t('form.categories.options.business') },
					{ value: 'personal', label: t('form.categories.options.personal') },
					{ value: 'portfolio', label: t('form.categories.options.portfolio') },
				],
				conditions: [
					{
						field: 'infrastructure',
						operator: 'equals',
						value: 'Kubernetes',
						type: 'display',
					},
				],
			},
			{
				name: 'downloadsProtectionScript',
				type: 'checkbox',
				label: t('form.downloadsProtectionScript.label'),
				placeholder: t('form.downloadsProtectionScript.placeholder'),
				section: 'advanced',
				width: 'full',
				conditions: [
					{
						field: 'infrastructure',
						operator: 'equals',
						value: 'Kubernetes',
						type: 'display',
					},
					{
						field: 'url',
						operator: 'regex',
						value: '^https?://inside[.]epfl[.]ch(/.*)?$',
						type: 'default',
						defaultValue: true,
					},
					{
						field: 'url',
						operator: 'regex',
						value: '^https?://inside[.]epfl[.]ch(/.*)?$',
						type: 'disabled',
					},
				],
			},
			{
				name: 'ticket',
				type: 'text',
				label: t('form.ticket.label'),
				placeholder: t('form.ticket.placeholder'),
				section: 'metadata',
				width: 'half',
			},
			{
				name: 'comment',
				type: 'textarea',
				label: t('form.comment.label'),
				placeholder: t('form.comment.placeholder'),
				section: 'metadata',
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
				name: 'details',
				title: t('form.sections.details.title'),
				columns: 2,
				conditions: [
					{
						field: 'infrastructure',
						operator: 'equals',
						value: 'Kubernetes',
					},
				],
			},
			{
				name: 'advanced',
				title: t('form.sections.advanced.title'),
				columns: 1,
				conditions: [
					{
						field: 'infrastructure',
						operator: 'equals',
						value: 'Kubernetes',
					},
				],
			},
			{
				name: 'metadata',
				title: t('form.sections.metadata.title'),
				columns: 2,
			},
		];

		return {
			schema: siteSchema(errorMessages),
			fields,
			sections,
			defaultValues: {
				infrastructure: 'kubernetes',
				url: '',
				title: '',
				tagline: '',
				theme: '',
				unitId: 0,
				languages: [],
				categories: [],
				downloadsProtectionScript: false,
				ticket: '',
				comment: '',
			},
			apiEndpoint: '/api/sites',
			method: 'POST',
			submitButtonText: t('actions.create'),
			resetButtonText: t('actions.reset'),
			loadingText: t('actions.creating'),
			successTitle: t('add.success.title'),
			successMessage: t('add.success.message'),
			errorMessage: t('add.error.title'),
			onSuccess: () => {},
			onError: (error) => {
				console.error('Error creating site:', error);
			},
		};
	};

	return (
		<div className="w-full flex-1 flex flex-col h-full overflow-y-auto">
			<div className="pb-3">
				<div className="p-6 pb-4 flex-shrink-0 mt-1">
					<div className="flex items-center justify-between h-10">
						<h1 className="text-3xl font-bold">{t('add.title')}</h1>
					</div>
				</div>
				<div className="px-6 pb-0 h-full">
					<Form config={getFormConfig()} />
				</div>
			</div>
		</div>
	);
};
