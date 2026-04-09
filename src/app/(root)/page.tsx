"use server";

import { CircleX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorComponent } from "@/components/error";
import { SiteList } from "@/components/pages/sites/list";
import { getUserPermissions } from "@/services/auth";
import { listSites } from "@/services/site";

export default async function SiteListPage() {
	const t = await getTranslations("site.list");
	const { sites, error } = await listSites();

	const permissions = await getUserPermissions();

	if (error) {
		return <ErrorComponent text={t("error.text")} subText={error.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!sites) {
		return <ErrorComponent text={t("error.text")} subText={t("error.subText")} Icon={CircleX} color="text-red-500" />;
	}

	return <SiteList sites={sites} permissions={permissions} />;
}
