"use client";
import React, { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableColumn } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import moment from "moment";
import "moment/locale/fr";
import { LogType } from "@/types/log";
import { LOG_LEVELS } from "@/constants/logs";
import { UserRound, ChevronDown } from "lucide-react";
import Link from "next/link";

const getLogLevelConfig = (level: string) => {
	return Object.values(LOG_LEVELS).find((config) => config.NAME.toLowerCase() === level.toLowerCase());
};

const parseMessage = (message: string) => {
	return message.split(/('''.*?''')/gs).flatMap((part, i) => {
		if (part.startsWith("'''") && part.endsWith("'''")) {
			return <pre key={i} className="inline bg-gray-100 px-1 py-1 rounded text-xs font-mono">{part.slice(3, -3)}</pre>;
		}
		return part.split(/(\*\*.*?\*\*)/g).map((bp, j) =>
			bp.startsWith("**") && bp.endsWith("**")
				? <strong key={`${i}-${j}`} className="font-semibold">{bp.slice(2, -2)}</strong>
				: bp,
		);
	});
};

const logLevels = Object.values(LOG_LEVELS).map((level) => level.NAME.toLowerCase());

const DEFAULT_SELECTED_ACTIONS = ["create", "update", "delete", "associate", "disassociate"];

export const LogList: React.FC<{ logs: LogType[] }> = ({ logs }) => {
	const availableActions = useMemo(() => {
		const actions = new Set<string>();
		logs.forEach((log) => {
			if (log.data?.action) {
				actions.add(log.data.action);
			}
		});
		return Array.from(actions).sort();
	}, [logs]);

	const [selectedActions, setSelectedActions] = useState<string[]>(() => {
		const defaultActions = availableActions.filter((action) => DEFAULT_SELECTED_ACTIONS.includes(action.toLowerCase()));

		return defaultActions.length > 0 ? defaultActions : availableActions;
	});

	const [search, setSearch] = useState({
		message: "",
		level: "",
	});

	const t = useTranslations("log");
	const locale = useLocale();

	const filteredLogs = logs.filter((log) => {
		const matchesMessage = log.message.toLowerCase().includes(search.message.toLowerCase());
		const matchesLevel = search.level === "" || log.level === search.level;
		const matchesAction = selectedActions.includes(log.data.action);

		return matchesMessage && matchesLevel && matchesAction;
	});

	const handleActionToggle = (action: string) => {
		setSelectedActions((prev) => (prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]));
	};

	const columns: TableColumn<LogType>[] = [
		{
			key: "timestamp",
			label: t("list.column.timestamp"),
			width: "w-[10%]",
			align: "left",
			sortable: true,
			render: (log) => (
				<div className="text-sm font-medium" title={moment(log.timestamp).locale(locale).format("LLLL")}>
					{moment(log.timestamp).locale(locale).format("DD/MM/YYYY HH:mm:ss")}
				</div>
			),
		},
		{
			key: "level",
			label: t("list.column.level"),
			width: "w-[10%]",
			align: "left",
			sortable: true,
			render: (log) => {
				const levelConfig = getLogLevelConfig(log.level);
				return (
					<div className="text-black p-1.5 sm:p-2 h-8 sm:h-9 flex gap-0.5 sm:gap-1 justify-center items-center border-2 rounded-sm" style={{ borderColor: levelConfig?.COLOR, color: levelConfig?.COLOR }}>
						{levelConfig?.ICON
							? React.createElement(levelConfig.ICON, {
								className: "size-3 sm:size-4",
								strokeWidth: 2.3,
							})
							: null}
						<span className="text-xs sm:text-sm font-semibold uppercase hidden sm:inline">{levelConfig?.LABEL[locale as "fr" | "en"] || log.level}</span>
					</div>
				);
			},
		},
		{
			key: "message",
			label: t("list.column.message"),
			width: "w-[50%]",
			align: "left",
			sortable: true,
			render: (log) => (
				<div className="text-sm py-1 leading-relaxed" title={log.message}>
					{parseMessage(log.message)}
				</div>
			),
		},
		{
			key: "userId",
			label: t("list.column.user"),
			width: "w-[18%]",
			align: "left",
			sortable: true,
			render: (log) => (
				<div className="text-sm text-gray-600 flex items-center gap-1" title={log.user?.name || "-"}>
					{log.user ? (
						<Link href={`https://people.epfl.ch/${log.user.userId}`} className="flex items-center justify-center gap-1 hover:underline min-w-0">
							<UserRound className="size-3 sm:size-4 flex-shrink-0" />
							<p className="truncate">{log.user.name}</p>
						</Link>
					) : (
						<span className="italic">-</span>
					)}
				</div>
			),
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0 mt-1">
				<div className="flex items-center justify-between h-10">
					<h1 className="text-3xl font-bold">{t("list.title")}</h1>
				</div>
				<div className="flex gap-2 mt-6">
					<Input onChange={(e) => setSearch({ ...search, message: e.target.value })} value={search.message} placeholder={t("list.search.message.placeholder")} className="flex-1 h-10" />
					<Select onValueChange={(value) => setSearch({ ...search, level: value === "all" ? "" : value })} value={search.level || "all"}>
						<SelectTrigger className="w-48 !h-10">
							<SelectValue placeholder={t("list.search.level.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("list.search.level.all")}</SelectItem>
							{logLevels.map((levelName: string) => {
								const levelConfig = getLogLevelConfig(levelName);
								return (
									<SelectItem key={levelName} value={levelName}>
										{levelConfig?.LABEL[locale as "fr" | "en"] || levelName}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" className="w-64 h-10 justify-between">
								<span className="truncate">{selectedActions.length === 0 ? t("list.search.action.all") : selectedActions.length === availableActions.length ? t("list.search.action.all") : t("list.search.action.selected", { count: selectedActions.length })}</span>
								<ChevronDown className="h-4 w-4 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-64 p-0" align="start">
							<div className="max-h-64 overflow-y-auto">
								{availableActions.map((action) => (
									<div key={action} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
										<Checkbox id={`action-${action}`} checked={selectedActions.includes(action)} onCheckedChange={() => handleActionToggle(action)} />
										<label htmlFor={`action-${action}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
											{action.charAt(0).toUpperCase() + action.slice(1)}
										</label>
									</div>
								))}
								{availableActions.length === 0 && <div className="p-4 text-sm text-gray-500 text-center">{t("list.search.action.empty")}</div>}
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</div>

			<div className="px-3 sm:px-4 md:px-6 pb-0 h-full overflow-hidden">
				<div className="h-full overflow-auto">
					<Table data={filteredLogs} columns={columns} defaultSort={{ key: "timestamp", direction: "desc" }} />
				</div>
			</div>
		</div>
	);
};
