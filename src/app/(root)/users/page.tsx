"use client";
import moment from "moment";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, type TableColumn } from "@/components/ui/table";
import "moment/locale/fr";
import { Loader2, Users } from "lucide-react";
import Link from "next/link";
import { getUsersFromLogsAction } from "@/services/users";
import type { UserSummary } from "@/types/user";

const ROLE_STYLES: Record<string, string> = {
	admin: "bg-red-100 text-red-700 border border-red-200",
	editor: "bg-blue-100 text-blue-700 border border-blue-200",
	public: "bg-gray-100 text-gray-600 border border-gray-200",
};

export default function UserListPage() {
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	const translations = {
		userList: useTranslations("pages.userList"),
	};
	const locale = useLocale();

	useEffect(() => {
		getUsersFromLogsAction().then((result) => {
			if (result.success) setUsers(result.users);
			setLoading(false);
		});
	}, []);

	const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

	const columns: TableColumn<UserSummary>[] = [
		{
			key: "name",
			label: translations.userList("column.name"),
			width: "w-[35%]",
			align: "left",
			sortable: true,
			render: (user) => (
				<Link href={`https://people.epfl.ch/${user.userId}`} className="flex items-center gap-2 hover:underline min-w-0" target="_blank" rel="noopener noreferrer">
					<span className="text-sm font-medium truncate">{user.name}</span>
				</Link>
			),
		},
		{
			key: "role",
			label: translations.userList("column.role"),
			width: "w-[20%]",
			align: "left",
			sortable: true,
			render: (user) => (
				<span className={`text-xs font-semibold px-2 py-1 rounded-sm ${ROLE_STYLES[user.role] ?? ""}`}>{translations.userList(`role.${user.role}`)}</span>
			),
		},
		{
			key: "lastActivity",
			label: translations.userList("column.lastActivity"),
			width: "w-[30%]",
			align: "left",
			sortable: true,
			render: (user) => (
				<span className="text-sm text-gray-600" title={moment(user.lastActivity).locale(locale).format("LLLL")}>
					{moment(user.lastActivity).locale(locale).fromNow()}
				</span>
			),
		},
		{
			key: "actionCount",
			label: translations.userList("column.actions"),
			width: "w-[15%]",
			align: "right",
			sortable: true,
			render: (user) => <span className="text-sm text-gray-500">{user.actionCount}</span>,
		},
	];

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 shrink-0 mt-1">
				<div className="flex items-center justify-between h-10">
					<h1 className="text-3xl font-bold">{translations.userList("title")}</h1>
					{loading && <Loader2 className="h-5 w-5 animate-spin" />}
				</div>
				<div className="flex gap-2 mt-6">
					<Input onChange={(e) => setSearch(e.target.value)} value={search} placeholder={translations.userList("search.placeholder")} className="flex-1 h-10" disabled={loading} />
				</div>
				{!loading && (
					<p className="mt-2 text-sm text-gray-500">
						{translations.userList("results", { count: filtered.length, total: users.length })}
					</p>
				)}
			</div>
			<div className="px-6 pb-0 flex-1 overflow-hidden">
				<div className="h-full overflow-y-auto">
					{loading ? (
						<div className="flex justify-center items-center py-8">
							<Loader2 className="h-8 w-8 animate-spin" />
							<span className="ml-2 text-sm text-gray-600">{translations.userList("loading")}</span>
						</div>
					) : filtered.length > 0 ? (
						<Table data={filtered} columns={columns} defaultSort={{ key: "lastActivity", direction: "desc" }} />
					) : (
						<div className="rounded-md flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
							<Users className="size-10 opacity-30" />
							<p className="text-sm">{translations.userList("empty")}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
