'use client';
import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SiteType } from '@/types/site';
import { TagType } from '@/types/tag';
import { CircleAlert, CircleCheck, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TAG_CATEGORIES } from '@/constants/tags';

interface SiteTagsUpdateProps {
	site: SiteType;
	tags: TagType[];
}

interface ApiResponse {
	success: boolean;
	message: string;
	data?: unknown;
}

export const SiteTagsUpdate: React.FC<SiteTagsUpdateProps> = ({ site, tags }) => {
	const t = useTranslations('site.tags');
	const locale = useLocale();
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [originalTags, setOriginalTags] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionResult, setSubmissionResult] = useState<ApiResponse | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState(false);

	useEffect(() => {
		const currentTagIds = site.tags || [];
		setSelectedTags(currentTagIds);
		setOriginalTags(currentTagIds);
	}, [site]);

	const handleTagToggle = (tagId: string) => {
		setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
	};

	const handleReset = () => {
		setSelectedTags(originalTags);
		setHasSubmitted(false);
		setSubmissionResult(null);
	};

	const hasChanges = () => {
		return JSON.stringify(selectedTags.sort()) !== JSON.stringify(originalTags.sort());
	};

	const updateTagAssociations = async (tagId: string, shouldAssociate: boolean) => {
		const endpoint = `/api/tags/${tagId}/sites/${site.id}`;
		const method = shouldAssociate ? 'POST' : 'DELETE';

		const response = await fetch(endpoint, {
			method,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || `Failed to ${shouldAssociate ? 'associate' : 'dissociate'} tag`);
		}

		return response.json();
	};

	const onSubmit = async () => {
		setHasSubmitted(true);
		setIsSubmitting(true);
		setSubmissionResult(null);

		const startTime = Date.now();

		try {
			const tagsToAdd = selectedTags.filter((tagId) => !originalTags.includes(tagId));
			const tagsToRemove = originalTags.filter((tagId) => !selectedTags.includes(tagId));

			for (const tagId of tagsToAdd) {
				await updateTagAssociations(tagId, true);
			}

			for (const tagId of tagsToRemove) {
				await updateTagAssociations(tagId, false);
			}

			const elapsedTime = Date.now() - startTime;
			const remainingTime = Math.max(0, 2000 - elapsedTime);
			await new Promise((resolve) => setTimeout(resolve, remainingTime));

			const successResult: ApiResponse = {
				success: true,
				message: t('success.message'),
			};

			setSubmissionResult(successResult);
			setOriginalTags(selectedTags);
			setHasSubmitted(false);
		} catch (error) {
			const elapsedTime = Date.now() - startTime;
			const remainingTime = Math.max(0, 2000 - elapsedTime);
			await new Promise((resolve) => setTimeout(resolve, remainingTime));

			const errorResult: ApiResponse = {
				success: false,
				message: error instanceof Error ? error.message : t('error.unknown'),
			};

			setSubmissionResult(errorResult);
		} finally {
			setIsSubmitting(false);
		}
	};

	const tagsByType = tags.reduce((acc, tag) => {
		if (!acc[tag.type]) {
			acc[tag.type] = [];
		}
		acc[tag.type].push(tag);
		return acc;
	}, {} as Record<string, TagType[]>);

	Object.keys(tagsByType).forEach((type) => {
		tagsByType[type].sort((a, b) => (locale === 'fr' ? (a.nameFr || a.nameEn).localeCompare(b.nameFr || b.nameEn) : (a.nameEn || a.nameFr).localeCompare(b.nameEn || b.nameFr)));
	});

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between h-10">
					<h1 className="text-3xl font-bold">{t('title')}</h1>
					<div className="text-sm text-muted-foreground">
						{t('siteUrl')}: <span className="font-medium">{site.url}</span>
					</div>
				</div>
			</div>

			<div className="px-6 pb-6 h-full overflow-y-auto">
				{submissionResult?.success && (
					<div className="mb-6 border border-green-200 bg-green-50 p-4 rounded-lg">
						<div className="flex gap-2 items-center">
							<div className="flex-shrink-0">
								<CircleCheck className="h-6 w-6 text-green-600" />
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="text-sm font-semibold text-green-800">{t('success.title')}</h3>
							</div>
						</div>
					</div>
				)}

				{hasSubmitted && submissionResult && !submissionResult.success && (
					<div className="w-full mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
						<div className="flex items-start gap-2">
							<CircleAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
							<div className="flex-1">
								<p className="font-medium">{t('error.title')}</p>
								<p className="text-sm">{submissionResult.message}</p>
							</div>
							<Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0" onClick={() => setSubmissionResult(null)}>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}

				<div className="space-y-6 mt-2">
					<div className="space-y-8">
						{Object.entries(tagsByType).map(([type, typeTags]) => {
							const categoryConfig = Object.values(TAG_CATEGORIES).find((category) => category.NAME === type);
							const CategoryIcon = categoryConfig?.ICON;

							return (
								<div key={type} className="space-y-4">
									<div className="flex items-center gap-2">
										{CategoryIcon && (
											<div
												className="size-8 flex items-center justify-center rounded"
												style={{
													backgroundColor: categoryConfig.COLOR ? `${categoryConfig.COLOR}20` : '#f3f4f6',
													color: categoryConfig.COLOR || '#6b7280',
												}}>
												<CategoryIcon className="w-5 h-5" />
											</div>
										)}
										<h3 className="text-lg font-semibold">{categoryConfig?.LABEL[locale as 'fr' | 'en']}</h3>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
										{typeTags.map((tag) => {
											const isSelected = selectedTags.includes(tag.id);
											const displayName = locale === 'fr' ? tag.nameFr || tag.nameEn : tag.nameEn || tag.nameFr;
											const displayUrl = locale === 'fr' ? tag.urlFr || tag.urlEn : tag.urlEn || tag.urlFr;

											return (
												<div key={tag.id} className={cn('relative cursor-pointer border-2 p-4 rounded-lg transition-all duration-200', isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md', isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300')} onClick={isSubmitting ? undefined : () => handleTagToggle(tag.id)}>
													<div className="flex items-start space-x-3">
														<Checkbox checked={isSelected} disabled={isSubmitting} className="mt-0.5" />
														<div className="flex-1 min-w-0">
															<div className="text-sm font-medium text-gray-900">{displayName}</div>
															{displayUrl && <div className="text-xs text-blue-600 mt-1 truncate">{displayUrl}</div>}
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>

					<div className="flex justify-end gap-2 pt-6 border-t">
						<Button variant="outline" onClick={handleReset} disabled={isSubmitting || !hasChanges()}>
							{t('actions.reset')}
						</Button>
						<Button onClick={onSubmit} disabled={isSubmitting || !hasChanges()} className="min-w-32 gap-1 cursor-pointer">
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									{t('actions.saving')}...
								</>
							) : (
								t('actions.save')
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
