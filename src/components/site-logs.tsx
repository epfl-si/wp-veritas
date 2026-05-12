"use client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { getSiteLogsAction } from "@/services/logs";
import type { LogType } from "@/types/log";
import "moment/locale/fr";

const ACTION_CONFIG: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
	create: { color: "#10b981", icon: Plus },
	update: { color: "#3b82f6", icon: Pencil },
	delete: { color: "#ef4444", icon: Trash2 },
};

function cleanMessage(message: string, siteUrl?: string): string {
	let msg = message.replace(/'''|(\*\*)/g, "");
	if (siteUrl)
		msg = msg
			.replace(`Site ${siteUrl}`, "")
			.replace(/\s*\(Kubernetes\)\s*updated:\s*/i, "")
			.trim();
	return msg;
}

export function SiteLogs({ siteId, siteUrl }: { siteId: string; siteUrl?: string }) {
	const [logs, setLogs] = useState<LogType[]>([]);
	const [loading, setLoading] = useState(true);
	const locale = useLocale();
	const translations = { site: useTranslations("site") };

	useEffect(() => {
		getSiteLogsAction(siteId).then(({ logs: data }) => {
			setLogs(data.filter((log) => ["create", "update", "delete"].includes(log.data.action)).slice(0, 2));
			setLoading(false);
		});
	}, [siteId]);

	return (
		<div className="flex flex-col gap-0.5">
			{loading ? (
				<p className="text-xs text-gray-400">{translations.site("logs.loading")}</p>
			) : logs.length === 0 ? (
				<p className="text-xs text-gray-400">{translations.site("logs.empty")}</p>
			) : (
				<>
					<div className="divide-y divide-input border border-input rounded-md">
						{logs.map((log) => {
							const action = ACTION_CONFIG[log.data.action] ?? ACTION_CONFIG.update;
							const Icon = action.icon;
							return (
								<div key={log.id} className="flex items-start gap-2 px-2.5 py-2 text-xs">
									<span className="shrink-0 mt-0.5 rounded p-1 flex items-center justify-center" style={{ color: action.color, backgroundColor: `${action.color}18` }}>
										<Icon className="size-3" />
									</span>
									<div className="min-w-0 flex-1">
										<div className="text-gray-800 truncate">{cleanMessage(log.message, siteUrl)}</div>
										<div className="text-[10px] text-gray-400 mt-0.5">
											{log.user?.name && `${log.user.name} · `}
											{moment(log.timestamp).locale(locale).fromNow()}
										</div>
									</div>
								</div>
							);
						})}
					</div>
					<Link href="/logs" className="text-xs text-blue-600 hover:underline self-end">
						{translations.site("logs.viewAll")}
					</Link>
				</>
			)}
		</div>
	);
}
