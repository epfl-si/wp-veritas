"use server";
import { Error } from "@/components/error";
import { SiteTagsUpdate } from "@/components/pages/sites/tags";
import { getSite } from "@/services/site";
import { listTags } from "@/services/tag";
import { CircleX } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function SiteTagsPage({
	params,
}: {
	params: Promise<{
		siteId: string;
	}>;
}) {
	const t = await getTranslations("site.tags");
	const { siteId } = await params;

	const [siteResult, tagsResult] = await Promise.all([getSite(siteId), listTags()]);

	const { site, error: siteError } = siteResult;
	const { tags, error: tagsError } = tagsResult;

	if (siteError) {
		return <Error text={t("error.site")} subText={siteError.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!site) {
		return <Error text={t("error.siteNotFound")} subText={t("error.siteSubText")} Icon={CircleX} color="text-red-500" />;
	}

	if (tagsError) {
		return <Error text={t("error.tags")} subText={tagsError.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!tags || tags.length === 0) {
		return <Error text={t("error.noTags")} subText={t("error.noTagsSubText")} Icon={CircleX} color="text-red-500" />;
	}

	return <SiteTagsUpdate site={site} tags={tags} />;
}
