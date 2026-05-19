"use client";
import moment from "moment";
import "moment/locale/fr";
import { ArrowRight, MoveRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LOG_LEVELS } from "@/constants/logs";
import type { LogData, LogType } from "@/types/log";

export const getLogLevelConfig = (level: string) => {
	return Object.values(LOG_LEVELS).find((c) => c.NAME.toLowerCase() === level.toLowerCase());
};

export const parseMessage = (message: string) => {
	return message.split(/('''.*?''')/gs).flatMap((part, i) => {
		if (part.startsWith("'''") && part.endsWith("'''")) {
			return (
				// biome-ignore lint/suspicious/noArrayIndexKey: text parts have no stable ID
				<pre key={i} className="inline bg-gray-100 px-1 py-1 rounded text-xs font-mono break-all overflow-hidden whitespace-pre-wrap">
					{part.slice(3, -3)}
				</pre>
			);
		}
		return part.split(/(\*\*.*?\*\*)/g).map((bp, j) =>
			bp.startsWith("**") && bp.endsWith("**") ? (
				// biome-ignore lint/suspicious/noArrayIndexKey: text parts have no stable ID
				<strong key={`${i}-${j}`} className="font-semibold">
					{bp.slice(2, -2)}
				</strong>
			) : (
				bp
			),
		);
	});
};

function DataField({ label, value }: { label: string; value: unknown }) {
	if (value === undefined || value === null) return null;
	const display = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
			<pre className="text-xs bg-gray-50 border rounded p-2 whitespace-pre-wrap break-all font-mono overflow-x-auto">{display}</pre>
		</div>
	);
}

export function LogDetailDialog({ log, onClose }: { log: LogType | null; onClose: () => void }) {
	const locale = useLocale();
	if (!log) return null;
	const levelConfig = getLogLevelConfig(log.level);
	const { type, action, id, url, error, object, changes, count, ...rest } = log.data as LogData & Record<string, unknown>;
	const extraKeys = Object.entries(rest).filter(([, v]) => v !== undefined);

	return (
		<Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<span className="text-sm font-mono" style={{ color: levelConfig?.COLOR }}>
							[{log.level.toUpperCase()}]
						</span>
						<span className="text-sm">{moment(log.timestamp).locale(locale).format("DD/MM/YYYY HH:mm:ss")}</span>
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-2">
					<div>
						<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Message</p>
						<p className="text-sm font-medium leading-relaxed">{parseMessage(log.message)}</p>
					</div>
					<Separator />
					<div className="grid grid-cols-2 gap-3">
						<DataField label="Type" value={type} />
						<DataField label="Action" value={action} />
						{id && <DataField label="ID" value={id} />}
						{url && <DataField label="URL" value={url} />}
						{count !== undefined && <DataField label="Count" value={count} />}
						{log.user && <DataField label="User" value={`${log.user.name} (${log.user.userId})`} />}
					</div>
					{error && (
						<>
							<Separator />
							<div className="space-y-2">
								<p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Error</p>
								<DataField label="Message" value={error.message} />
								{error.stack && <DataField label="Stack trace" value={error.stack} />}
							</div>
						</>
					)}
					{object !== undefined && (
						<>
							<Separator />
							<DataField label="Object" value={object} />
						</>
					)}
					{changes && (
						<>
							<Separator />
							<div className="space-y-2">
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Changes</p>
								{Object.entries(changes).map(([field, { from, to }]) => (
									<div key={field} className="flex items-center gap-2 text-xs">
										<Badge variant="outline" className="font-mono shrink-0">
											{field}
										</Badge>
										<span className="text-gray-400 line-through truncate">{String(from ?? "–")}</span>
										<span className="text-gray-600">
											<MoveRight className="size-2" />
										</span>
										<span className="font-medium truncate">{String(to ?? "–")}</span>
									</div>
								))}
							</div>
						</>
					)}
					{extraKeys.length > 0 && (
						<>
							<Separator />
							<div className="space-y-3">
								<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Additional fields</p>
								{extraKeys.map(([k, v]) => (
									<DataField key={k} label={k} value={v} />
								))}
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
