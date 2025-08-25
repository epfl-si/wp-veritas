"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { UserRound, ChevronDown, Loader2 } from "lucide-react";
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

const ACTIONS = ["create", "update", "delete", "associate", "disassociate", "list", "read"];
const DEFAULT_SELECTED_ACTIONS = ["create", "update", "delete", "associate", "disassociate"];
const ITEMS_PER_PAGE = 100;
const SCROLL_THRESHOLD = 200;

interface LogListProps {
	logs?: LogType[];
}

export const LogList: React.FC<LogListProps> = () => {
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
	const [search, setSearch] = useState({
		message: "",
		level: "",
	});

	const t = useTranslations("log");
	const locale = useLocale();

	const actionStats = useMemo(() => {
		const totalActions = ACTIONS.length;
		const selectedCount = selectedActions.length;
		const hiddenCount = totalActions - selectedCount;

		return {
			totalActions,
			selectedCount,
			hiddenCount,
			showingAll: selectedCount === totalActions,
		};
	}, [selectedActions]);



	const fetchLogs = useCallback(async (
		searchParams: { message: string; level: string; actions: string[] },
		page: number,
	) => {
		try {
			const params = new URLSearchParams();
			if (searchParams.message.trim()) params.append("search", searchParams.message.trim());
			if (searchParams.level) params.append("level", searchParams.level);
			if (searchParams.actions.length > 0) params.append("actions", searchParams.actions.join(","));

			params.append("limit", ITEMS_PER_PAGE.toString());
			params.append("skip", (page * ITEMS_PER_PAGE).toString());

			const response = await fetch(`/api/logs?${params.toString()}`);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.message || "API returned success: false");
			}

			return {
				logs: data.logs || [],
				total: data.total || 0,
				filteredTotal: data.filteredTotal || data.total || 0,
			};
		} catch (error) {
			console.error("Error fetching logs:", error);
			return {
				logs: [],
				total: 0,
				filteredTotal: 0,
			};
		}
	}, []);

	const fetchTotalWithoutActionFilter = useCallback(async (
		searchParams: { message: string; level: string },
	) => {
		try {
			const params = new URLSearchParams();
			if (searchParams.message.trim()) params.append("search", searchParams.message.trim());
			if (searchParams.level) params.append("level", searchParams.level);

			params.append("actions", ACTIONS.join(","));
			params.append("limit", "1");
			params.append("skip", "0");

			const response = await fetch(`/api/logs?${params.toString()}`);
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					setTotalWithoutActionFilter(data.total || 0);
				}
			}
		} catch (error) {
			console.error("Error fetching total without action filter:", error);
		}
	}, []);

	const searchLogs = useCallback(async (searchParams: { message: string; level: string; actions: string[] }) => {
		if (isLoadingRef.current) return;

		setLoading(true);
		isLoadingRef.current = true;
		searchParamsRef.current = searchParams;

		try {
			const [result] = await Promise.all([
				fetchLogs(searchParams, 0),
				fetchTotalWithoutActionFilter({ message: searchParams.message, level: searchParams.level }),
			]);

			setLogs(result.logs);
			setFilteredTotal(result.total);
			setCurrentPage(0);
			setHasMore(result.logs.length === ITEMS_PER_PAGE);

			if (scrollContainerRef.current) {
				scrollContainerRef.current.scrollTop = 0;
			}
		} finally {
			setLoading(false);
			isLoadingRef.current = false;
		}
	}, [fetchLogs, fetchTotalWithoutActionFilter]);

	const loadMore = useCallback(async () => {
		if (isLoadingRef.current || !hasMore || loadingMore) {
			return;
		}

		setLoadingMore(true);
		isLoadingRef.current = true;

		const nextPage = currentPage + 1;

		try {
			const result = await fetchLogs(searchParamsRef.current, nextPage);

			if (result.logs.length > 0) {
				setLogs(prev => [...prev, ...result.logs]);
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
		if (!container || isLoadingRef.current || !hasMore) {
			return;
		}

		const { scrollTop, scrollHeight, clientHeight } = container;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

		if (distanceFromBottom < SCROLL_THRESHOLD) {
			loadMore();
		}
	}, [hasMore, loadMore]);

	useEffect(() => {
		const initialSearchParams = {
			message: "",
			level: "",
			actions: DEFAULT_SELECTED_ACTIONS,
		};
		searchLogs(initialSearchParams);
	}, [searchLogs]);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			const newSearchParams = {
				message: search.message,
				level: search.level,
				actions: selectedActions,
			};

			searchLogs(newSearchParams);
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

		return () => {
			container.removeEventListener("scroll", throttledHandleScroll);
		};
	}, [handleScroll]);

	const handleActionToggle = (action: string) => {
		setSelectedActions((prev) =>
			prev.includes(action)
				? prev.filter((a) => a !== action)
				: [...prev, action],
		);
	};

	const getActionButtonText = () => {
		if (actionStats.showingAll) {
			return t("list.search.action.all");
		}

		if (actionStats.selectedCount === 0) {
			return t("list.search.action.empty");
		}

		return t("list.search.action.selected", { count: actionStats.selectedCount });
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
					{loading && <Loader2 className="h-5 w-5 animate-spin" />}
				</div>

				<div className="flex gap-2 mt-6">
					<Input
						onChange={(e) => setSearch({ ...search, message: e.target.value })}
						value={search.message}
						placeholder={t("list.search.message.placeholder")}
						className="flex-1 h-10"
						disabled={loading}
					/>

					<Select onValueChange={(value) => setSearch({ ...search, level: value === "all" ? "" : value })} value={search.level || "all"} disabled={loading}>
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
							<Button variant="outline" className="w-80 h-10 justify-between" disabled={loading}>
								<div className="flex items-center gap-2 truncate">
									<span className="truncate">{getActionButtonText()}</span>
								</div>
								<ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
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
						<div className="text-gray-600">
							{t("list.results", { count: logs.length, total: filteredTotal })}
						</div>
						{actionStats.hiddenCount > 0 && totalWithoutActionFilter > filteredTotal && (
							<div className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs">
								{t("list.filtered.hidden", { count: totalWithoutActionFilter - filteredTotal })}
							</div>
						)}
					</div>
				)}
			</div>

			<div className="px-3 sm:px-4 md:px-6 pb-0 flex-1 overflow-hidden">
				<div
					ref={scrollContainerRef}
					className="h-full overflow-y-auto"
					style={{ scrollBehavior: "smooth" }}
				>
					{logs.length > 0 ? (
						<>
							<Table data={logs} columns={columns} />

							{loadingMore && (
								<div className="flex justify-center items-center py-4">
									<Loader2 className="h-5 w-5 animate-spin" />
									<span className="ml-2 text-sm text-gray-600">{t("list.loading.more")}</span>
								</div>
							)}

							{!hasMore && (
								<div className="flex justify-center py-4">
									<span className="text-sm text-gray-500">{t("list.no.more")}</span>
								</div>
							)}
						</>
					) : loading ? (
						<div className="flex justify-center items-center py-8">
							<Loader2 className="h-8 w-8 animate-spin" />
							<span className="ml-2 text-sm text-gray-600">{t("list.loading.initial")}</span>
						</div>
					) : (
						<div className="flex justify-center py-8">
							<span className="text-sm text-gray-500">{t("list.error.empty")}</span>
						</div>
					)}
				</div>
			</div>
		</div >
	);
};
