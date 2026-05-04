"use client";
import { CircleAlert, CircleCheck, Loader2, Pencil, Plus, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TAG_CATEGORIES } from "@/constants/tags";
import { cn } from "@/lib/utils";
import { getSite } from "@/services/site";
import { associateTagWithSite, disassociateTagFromSite, listTags } from "@/services/tag";
import type { TagsType } from "@/types/tag";

export default function SiteTagsPage() {
	const params = useParams();
	const siteId = params.siteId as string;
	const t = useTranslations("site.tags");
	const tSite = useTranslations("site");
	const locale = useLocale();
	const containerRef = useRef<HTMLDivElement>(null);

	const [siteUrl, setSiteUrl] = useState<string>("");
	const [tags, setTags] = useState<TagsType[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [originalTags, setOriginalTags] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionResult, setSubmissionResult] = useState<{ success: boolean; message: string } | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState(false);

	useEffect(() => {
		Promise.all([getSite(siteId), listTags()]).then(([siteResult, tagsResult]) => {
			if (siteResult.site) {
				setSiteUrl(siteResult.site.url);
				const currentTagIds = siteResult.site.tags || [];
				setSelectedTags(currentTagIds);
				setOriginalTags(currentTagIds);
			}
			if (tagsResult.tags) setTags(tagsResult.tags);
		});
	}, [siteId]);

	const handleTagToggle = (tagId: string) => {
		setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
	};

	const handleReset = () => {
		setSelectedTags(originalTags);
		setHasSubmitted(false);
		setSubmissionResult(null);
	};

	const hasChanges = () => JSON.stringify(selectedTags.sort()) !== JSON.stringify(originalTags.sort());

	const updateTagAssociations = async (tagId: string, shouldAssociate: boolean) => {
		const { error } = shouldAssociate ? await associateTagWithSite(tagId, siteId) : await disassociateTagFromSite(tagId, siteId);
		if (error) throw new Error(error.message || `Failed to ${shouldAssociate ? "associate" : "dissociate"} tag`);
	};

	const scrollToTop = () => {
		if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
	};

	const onSubmit = async () => {
		setHasSubmitted(true);
		setIsSubmitting(true);
		setSubmissionResult(null);
		const startTime = Date.now();
		try {
			const tagsToAdd = selectedTags.filter((tagId) => !originalTags.includes(tagId));
			const tagsToRemove = originalTags.filter((tagId) => !selectedTags.includes(tagId));
			for (const tagId of tagsToAdd) await updateTagAssociations(tagId, true);
			for (const tagId of tagsToRemove) await updateTagAssociations(tagId, false);
			const remainingTime = Math.max(0, 2000 - (Date.now() - startTime));
			await new Promise((resolve) => setTimeout(resolve, remainingTime));
			setSubmissionResult({ success: true, message: t("success.message") });
			setOriginalTags(selectedTags);
			setHasSubmitted(false);
			scrollToTop();
		} catch (error) {
			const remainingTime = Math.max(0, 2000 - (Date.now() - startTime));
			await new Promise((resolve) => setTimeout(resolve, remainingTime));
			setSubmissionResult({ success: false, message: error instanceof Error ? error.message : t("error.unknown") });
			scrollToTop();
		} finally {
			setIsSubmitting(false);
		}
	};

	const getTagStatus = (tagId: string) => {
		const isSelected = selectedTags.includes(tagId);
		const wasOriginal = originalTags.includes(tagId);
		if (isSelected && wasOriginal) return "existing";
		if (isSelected && !wasOriginal) return "new";
		if (!isSelected && wasOriginal) return "removed";
		return "unselected";
	};

	const tagsByType = tags.reduce(
		(acc, tag) => {
			if (!acc[tag.type]) acc[tag.type] = [];
			acc[tag.type].push(tag);
			return acc;
		},
		{} as Record<string, TagsType[]>,
	);

	Object.keys(tagsByType).forEach((type) => {
		tagsByType[type].sort((a, b) => (locale === "fr" ? (a.nameFr || a.nameEn).localeCompare(b.nameFr || b.nameEn) : (a.nameEn || a.nameFr).localeCompare(b.nameEn || b.nameFr)));
	});

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 shrink-0 mt-1">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-3xl font-bold">{t("title")}</h1>
						<a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-1 inline-block font-mono">
							{siteUrl}
						</a>
					</div>
					<Button variant="outline" asChild>
						<Link href={`/sites/${siteId}/edit`}>
							<Pencil className="size-4" />
							{tSite("actions.edit")}
						</Link>
					</Button>
				</div>
			</div>
			<div ref={containerRef} className="px-6 pb-6 h-full overflow-y-auto">
				{submissionResult?.success && (
					<div className="mb-6 border border-green-200 bg-green-50 p-4 rounded-lg">
						<div className="flex gap-2 items-center">
							<div className="shrink-0">
								<CircleCheck className="h-6 w-6 text-green-600" />
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="text-sm font-semibold text-green-800">{t("success.title")}</h3>
							</div>
						</div>
					</div>
				)}
				{hasSubmitted && submissionResult && !submissionResult.success && (
					<div className="w-full mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
						<div className="flex items-start gap-2">
							<CircleAlert className="h-5 w-5 shrink-0 mt-0.5" />
							<div className="flex-1">
								<p className="font-medium">{t("error.title")}</p>
								<p className="text-sm">{submissionResult.message}</p>
							</div>
							<Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-100 shrink-0" onClick={() => setSubmissionResult(null)}>
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
													backgroundColor: categoryConfig.COLOR ? `${categoryConfig.COLOR}20` : "#f3f4f6",
													color: categoryConfig.COLOR || "#6b7280",
												}}
											>
												<CategoryIcon className="w-5 h-5" />
											</div>
										)}
										<h3 className="text-lg font-semibold">{categoryConfig?.LABEL[locale as "fr" | "en"]}</h3>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
										{typeTags.map((tag) => {
											const tagStatus = getTagStatus(tag.id);
											const isSelected = selectedTags.includes(tag.id);
											const displayName = locale === "fr" ? tag.nameFr || tag.nameEn : tag.nameEn || tag.nameFr;

											let borderClass = "";
											let bgClass = "";
											let iconElement = null;

											switch (tagStatus) {
												case "existing":
													borderClass = "border-primary";
													bgClass = "bg-primary/5";
													break;
												case "new":
													borderClass = "border-red-400";
													bgClass = "bg-red-50";
													iconElement = <Plus className="h-3 w-3 text-red-600" />;
													break;
												case "removed":
													borderClass = "border-red-300";
													bgClass = "bg-red-50";
													break;
												default:
													borderClass = "border-gray-200 hover:border-gray-300";
													bgClass = "";
											}

											return (
												// biome-ignore lint/a11y/useSemanticElements: tag card uses custom styling that requires div
												<div
													key={tag.id}
													role="button"
													tabIndex={0}
													className={cn(
														"relative cursor-pointer border-2 p-4 rounded-lg transition-all duration-200",
														isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:shadow-md",
														borderClass,
														bgClass,
														isSelected && "shadow-sm",
													)}
													onKeyDown={
														isSubmitting
															? undefined
															: (e) => {
																	if (e.key === "Enter" || e.key === " ") handleTagToggle(tag.id);
																}
													}
													onClick={isSubmitting ? undefined : () => handleTagToggle(tag.id)}
												>
													<div className="flex items-start space-x-3">
														<Checkbox checked={isSelected} disabled={isSubmitting} className="mt-0.5" />
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2">
																<div className="text-sm font-medium text-gray-900">{displayName}</div>
																{iconElement}
															</div>
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
							{t("actions.reset")}
						</Button>
						<Button onClick={onSubmit} disabled={isSubmitting || !hasChanges()} className="min-w-32 gap-1 cursor-pointer">
							{isSubmitting ? (
								<React.Fragment>
									<Loader2 className="h-4 w-4 animate-spin" />
									{t("actions.saving")}...
								</React.Fragment>
							) : (
								t("actions.save")
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
