"use server";
import { CircleX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorComponent } from "@/components/error";
import { SiteTagsUpdate } from "@/components/pages/sites/tags";
import { getSite } from "@/services/site";
import { listTags } from "@/services/tag";

export default async function SiteTagsPage({
	params,
}: {
	params: Promise<{
		siteId: string;
	}>;
}) {
	const t = await getTranslations("site");
	const { siteId } = await params;

	const [siteResult, tagsResult] = await Promise.all([getSite(siteId), listTags()]);

	const { site, error: siteError } = siteResult;
	const { tags, error: tagsError } = tagsResult;

	if (siteError) {
		return <ErrorComponent text={t("error.site")} subText={siteError.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!site) {
		return <ErrorComponent text={t("error.siteNotFound")} subText={t("error.siteSubText")} Icon={CircleX} color="text-red-500" />;
	}

	if (tagsError) {
		return <ErrorComponent text={t("tags.error.tags")} subText={tagsError.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!tags || tags.length === 0) {
		return <ErrorComponent text={t("tags.error.noTags")} subText={t("tags.error.noTagsSubText")} Icon={CircleX} color="text-red-500" />;
	}

	return <SiteTagsUpdate site={site} tags={tags} />;
}
