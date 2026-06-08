"use client";
import moment from "moment";
import { useLocale, useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, type TableColumn } from "@/components/ui/table";
import "moment/locale/fr";
import { ChevronDown, Loader2, UserRound } from "lucide-react";
import Link from "next/link";
import { getLogLevelConfig, LogDetailDialog, parseMessage } from "@/components/dialog/log";
import { LOG_LEVELS } from "@/constants/logs";
import { searchLogsAction } from "@/services/logs";
import type { LogType } from "@/types/log";

const logLevels = Object.values(LOG_LEVELS).map((level) => level.NAME.toLowerCase());

const ACTIONS = ["create", "update", "delete", "associate", "disassociate", "list", "read", "search"];
const DEFAULT_SELECTED_ACTIONS = ["create", "update", "delete", "associate", "disassociate"];
const ITEMS_PER_PAGE = 100;
const SCROLL_THRESHOLD = 200;

export default function LogListPage() {
	const [logs, setLogs] = useState<LogType[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [totalWithoutActionFilter, setTotalWithoutActionFilter] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [currentPage, setCurrentPage] = useState(0);
	const [filteredTotal, setFilteredTotal] = useState(0);

	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const isLoadingRef = useRef(false);
	const searchParamsRef = useRef<{ message: string; level: string; actions: string[] }>({
		message: "",
		level: "",
		actions: DEFAULT_SELECTED_ACTIONS,
	});

	const [selectedActions, setSelectedActions] = useState<string[]>(DEFAULT_SELECTED_ACTIONS);
	const [selectedLog, setSelectedLog] = useState<LogType | null>(null);
	const [search, setSearch] = useState({ message: "", level: "" });

	const translations = {
		logList: useTranslations("pages.logList"),
	};
	const locale = useLocale();

	const actionStats = useMemo(() => {
		const totalActions = ACTIONS.length;
		const selectedCount = selectedActions.length;
		const hiddenCount = totalActions - selectedCount;
		return { totalActions, selectedCount, hiddenCount, showingAll: selectedCount === totalActions };
	}, [selectedActions]);

	const fetchLogs = useCallback(async (searchParams: { message: string; level: string; actions: string[] }, page: number) => {
		try {
			const result = await searchLogsAction({
				search: searchParams.message.trim(),
				level: searchParams.level,
				actions: searchParams.actions,
				limit: ITEMS_PER_PAGE,
				skip: page * ITEMS_PER_PAGE,
			});
			if (!result.success) throw new Error("Failed to fetch logs");
			return { logs: result.logs, total: result.total, filteredTotal: result.total };
		} catch (error) {
			console.error("Error fetching logs:", error);
			return { logs: [], total: 0, filteredTotal: 0 };
		}
	}, []);

	const fetchTotalWithoutActionFilter = useCallback(async (searchParams: { message: string; level: string }) => {
		try {
			const result = await searchLogsAction({
				search: searchParams.message.trim(),
				level: searchParams.level,
				actions: ACTIONS,
				limit: 1,
				skip: 0,
			});
			if (result.success) setTotalWithoutActionFilter(result.total);
		} catch (error) {
			console.error("Error fetching total without action filter:", error);
		}
	}, []);

	const searchLogs = useCallback(
		async (searchParams: { message: string; level: string; actions: string[] }) => {
			if (isLoadingRef.current) return;
			setLoading(true);
			isLoadingRef.current = true;
			searchParamsRef.current = searchParams;
			try {
				const [result] = await Promise.all([fetchLogs(searchParams, 0), fetchTotalWithoutActionFilter({ message: searchParams.message, level: searchParams.level })]);
				setLogs(result.logs);
				setFilteredTotal(result.total);
				setCurrentPage(0);
				setHasMore(result.logs.length === ITEMS_PER_PAGE);
				if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
			} finally {
				setLoading(false);
				isLoadingRef.current = false;
			}
		},
		[fetchLogs, fetchTotalWithoutActionFilter],
	);

	const loadMore = useCallback(async () => {
		if (isLoadingRef.current || !hasMore || loadingMore) return;
		setLoadingMore(true);
		isLoadingRef.current = true;
		const nextPage = currentPage + 1;
		try {
			const result = await fetchLogs(searchParamsRef.current, nextPage);
			if (result.logs.length > 0) {
				setLogs((prev) => [...prev, ...result.logs]);
				setCurrentPage(nextPage);
				setHasMore(result.logs.length === ITEMS_PER_PAGE);
			} else {
				setHasMore(false);
			}
		} finally {
			setLoadingMore(false);
			isLoadingRef.current = false;
		}
	}, [currentPage, hasMore, loadingMore, fetchLogs]);

	const handleScroll = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container || isLoadingRef.current || !hasMore) return;
		const { scrollTop, scrollHeight, clientHeight } = container;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
		if (distanceFromBottom < SCROLL_THRESHOLD) loadMore();
	}, [hasMore, loadMore]);

	useEffect(() => {
		searchLogs({ message: "", level: "", actions: DEFAULT_SELECTED_ACTIONS });
	}, [searchLogs]);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			searchLogs({ message: search.message, level: search.level, actions: selectedActions });
		}, 300);
		return () => clearTimeout(timeoutId);
	}, [search.message, search.level, selectedActions, searchLogs]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		let ticking = false;
		const throttledHandleScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					handleScroll();
					ticking = false;
				});
				ticking = true;
			}
		};
		container.addEventListener("scroll", throttledHandleScroll, { passive: true });
		return () => container.removeEventListener("scroll", throttledHandleScroll);
	}, [handleScroll]);

	const handleActionToggle = (action: string) => {
		setSelectedActions((prev) => (prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]));
	};

	const getActionButtonText = () => {
		if (actionStats.showingAll) return translations.logList("filter.action.all");
		if (actionStats.selectedCount === 0) return translations.logList("filter.action.empty");
		return translations.logList("filter.action.selected", { count: actionStats.selectedCount });
	};

	const columns: TableColumn<LogType>[] = [
		{
			key: "timestamp",
			label: translations.logList("column.timestamp"),
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
			label: translations.logList("column.level"),
			width: "w-[10%]",
			align: "left",
			sortable: true,
			render: (log) => {
				const levelConfig = getLogLevelConfig(log.level);
				return (
					<div
						className="text-black p-1.5 sm:p-2 h-8 sm:h-9 flex gap-0.5 sm:gap-1 justify-center items-center border-2 rounded-sm"
						style={{ borderColor: levelConfig?.COLOR, color: levelConfig?.COLOR }}
					>
						{levelConfig?.ICON ? React.createElement(levelConfig.ICON, { className: "size-3 sm:size-4", strokeWidth: 2.3 }) : null}
						<span className="text-xs sm:text-sm font-semibold uppercase hidden sm:inline">{levelConfig?.LABEL[locale as "fr" | "en"] || log.level}</span>
					</div>
				);
			},
		},
		{
			key: "message",
			label: translations.logList("column.message"),
			width: "w-[50%]",
			align: "left",
			sortable: true,
			render: (log) => (
				<button type="button" className="text-left text-sm py-1 leading-relaxed break-all overflow-hidden w-full cursor-pointer" title={log.message} onClick={() => setSelectedLog(log)}>
					{parseMessage(log.message)}
					{log.data.error && <span className="ml-2 inline-flex items-center text-xs text-red-500 font-medium">[error details]</span>}
				</button>
			),
		},
		{
			key: "userId",
			label: translations.logList("column.user"),
			width: "w-[18%]",
			align: "left",
			sortable: true,
			render: (log) => (
				<div className="text-sm text-gray-600 flex items-center gap-1" title={log.user?.name || "-"}>
					{log.user ? (
						<Link href={`https://people.epfl.ch/${log.user.userId}`} className="flex items-center justify-center gap-1 hover:underline min-w-0">
							<UserRound className="size-3 sm:size-4 shrink-0" />
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
			<div className="p-6 pb-4 shrink-0 mt-1">
				<div className="flex items-center justify-between h-10">
					<h1 className="text-3xl font-bold">{translations.logList("title")}</h1>
					{loading && <Loader2 className="h-5 w-5 animate-spin" />}
				</div>
				<div className="flex gap-2 mt-6">
					<Input
						onChange={(e) => setSearch({ ...search, message: e.target.value })}
						value={search.message}
						placeholder={translations.logList("search.message")}
						className="flex-1 h-10"
						disabled={loading}
					/>
					<Select onValueChange={(value) => setSearch({ ...search, level: value === "all" ? "" : value })} value={search.level || "all"} disabled={loading}>
						<SelectTrigger className="w-48 h-10!">
							<SelectValue placeholder={translations.logList("filter.level.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{translations.logList("filter.level.all")}</SelectItem>
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
							<Button variant="outline" className="w-80 h-10 justify-between" disabled={loading}>
								<div className="flex items-center gap-2 truncate">
									<span className="truncate">{getActionButtonText()}</span>
								</div>
								<ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80 p-0" align="start">
							<div className="max-h-64 overflow-y-auto">
								{ACTIONS.map((action) => (
									<div key={action} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
										<Checkbox id={`action-${action}`} checked={selectedActions.includes(action)} onCheckedChange={() => handleActionToggle(action)} />
										<label htmlFor={`action-${action}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
											<div className="flex items-center justify-between">
												<span>{action.charAt(0).toUpperCase() + action.slice(1)}</span>
											</div>
										</label>
									</div>
								))}
							</div>
						</PopoverContent>
					</Popover>
				</div>
				{filteredTotal > 0 && (
					<div className="mt-2 flex items-center gap-4 text-sm">
						<div className="text-gray-600">{translations.logList("results", { count: logs.length, total: filteredTotal })}</div>
						{actionStats.hiddenCount > 0 && totalWithoutActionFilter > filteredTotal && (
							<div className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs">{translations.logList("filteredHidden", { count: totalWithoutActionFilter - filteredTotal })}</div>
						)}
					</div>
				)}
			</div>
			<div className="px-3 sm:px-4 md:px-6 pb-0 flex-1 overflow-hidden">
				<div ref={scrollContainerRef} className="h-full overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
					{logs.length > 0 ? (
						<React.Fragment>
							<Table data={logs} columns={columns} />
							{loadingMore && (
								<div className="flex justify-center items-center py-4">
									<Loader2 className="h-5 w-5 animate-spin" />
									<span className="ml-2 text-sm text-gray-600">{translations.logList("loadingMore")}</span>
								</div>
							)}
							{!hasMore && (
								<div className="flex justify-center py-4">
									<span className="text-sm text-gray-500">{translations.logList("noMore")}</span>
								</div>
							)}
						</React.Fragment>
					) : loading ? (
						<div className="flex justify-center items-center py-8">
							<Loader2 className="h-8 w-8 animate-spin" />
							<span className="ml-2 text-sm text-gray-600">{translations.logList("loading")}</span>
						</div>
					) : (
						<div className="flex justify-center py-8">
							<span className="text-sm text-gray-500">{translations.logList("empty")}</span>
						</div>
					)}
				</div>
			</div>
			<LogDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
		</div>
	);
}
