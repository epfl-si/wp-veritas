"use server";

import { Error } from "@/components/error";
import { LogList } from "@/components/pages/log/list";
import { listLogs } from "@/services/logs";
import { CircleX } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function LogListPage() {
	const t = await getTranslations("log.list");
	const { logs, error } = await listLogs();

	if (error) {
		return <Error text={t("error.text")} subText={error.message} Icon={CircleX} color="text-red-500" />;
	}

	if (!logs) {
		return <Error text={t("error.text")} subText={t("error.subText")} Icon={CircleX} color="text-red-500" />;
	}

	if (logs.length === 0) {
		return <Error text={t("error.empty")} subText="" Icon={CircleX} color="text-red-500" />;
	}

	return <LogList logs={logs} />;
}
