"use server";

import { CircleX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorComponent } from "@/components/error";
import { TagList } from "@/components/pages/tags/list";
import { getUserPermissions } from "@/services/auth";
import { listTags } from "@/services/tag";

export default async function TagListPage() {
	const t = await getTranslations("tag.list");
	const { tags, error } = await listTags();
	const permissions = await getUserPermissions();

	if (error) {
		return <ErrorComponent text={t("error.text")} subText={error.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!tags) {
		return <ErrorComponent text={t("error.text")} subText={t("error.subText")} Icon={CircleX} color="text-red-500" />;
	}

	return <TagList tags={tags} permissions={permissions} />;
}
