"use client";
import moment from "moment";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LOG_LEVELS } from "@/constants/logs";
import { getSiteLogsAction } from "@/services/logs";
import type { LogType } from "@/types/log";
import "moment/locale/fr";

const getLogLevelConfig = (level: string) => {
	return Object.values(LOG_LEVELS).find((config) => config.NAME.toLowerCase() === level.toLowerCase());
};

export function SiteLogs({ siteId, siteUrl }: { siteId: string; siteUrl?: string }) {
	const [lastLog, setLastLog] = useState<LogType | null>(null);
	const locale = useLocale();

	useEffect(() => {
		getSiteLogsAction(siteId).then(({ logs }) => {
			logs.forEach((log) => {
				console.log(`- [${log.data.action}] ${log.message} (by ${log.user?.name || "unknown user"} at ${log.timestamp})`);
			});
			setLastLog(logs.filter((log) => ["create", "update", "delete"].includes(log.data.action))[0] ?? null);
		});
	}, [siteId]);

	if (!lastLog) return null;

	const levelConfig = getLogLevelConfig(lastLog.level);

	return (
		<p className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
			<span style={{ color: levelConfig?.COLOR }}>●</span>
			<span>{moment(lastLog.timestamp).locale(locale).fromNow()}</span>
			{lastLog.user && <span>· {lastLog.user.name}</span>}
			<span className="truncate max-w-xs">· {lastLog.message.replace(/'''|(\*\*)/g, "").replace(`Site ${siteUrl} (Kubernetes) updated:`, "")}</span>
		</p>
	);
}
