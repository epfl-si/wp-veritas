"use server";
import { PERMISSIONS } from "@/constants/permissions";
import { httpError } from "@/lib/errors";
import log from "@/lib/log";
import db from "@/lib/mongo";
import { LogModel } from "@/models/Log";
import type { APIError } from "@/types/error";
import type { UserSummary } from "@/types/user";
import { getPersonsByIds } from "./api";
import { hasPermission } from "./policy";

// Actions only admins can perform (not in editor or public group permissions)
// - logs:list        → data.type = "log"
// - sites:create/update/delete → data.type = "site", data.action in ["create","update","delete"]
// - theme:list       → data.type = "theme"
//
// Actions editors can perform but public cannot
// - tags:*           → data.type = "tag"
// - sites:list/read  → data.type = "site", data.action in ["list","read"]
//
// Public can only perform: sites:search → data.type = "site", data.action = "search"

interface AggregatedUser {
	_id: string;
	lastActivity: Date;
	actionCount: number;
	hasAdminLog: number;
	hasSiteWrite: number;
	hasTheme: number;
	hasEditorAction: number;
}

export async function getUsersFromLogs(): Promise<{ users?: UserSummary[]; error?: APIError }> {
	try {
		if (!(await hasPermission(PERMISSIONS.LOGS.LIST))) {
			await log.warn("Permission denied for users list", { type: "user", action: "list" });
			return httpError.forbidden();
		}

		await db.connect();

		const docs: AggregatedUser[] = await LogModel.aggregate([
			{ $match: { userId: { $exists: true, $type: "string" } } },
			{
				$group: {
					_id: "$userId",
					lastActivity: { $max: "$timestamp" },
					actionCount: { $sum: 1 },
					hasAdminLog: {
						$max: { $cond: [{ $eq: ["$data.type", "log"] }, 1, 0] },
					},
					hasSiteWrite: {
						$max: {
							$cond: [
								{ $and: [{ $eq: ["$data.type", "site"] }, { $in: ["$data.action", ["create", "update", "delete"]] }] },
								1,
								0,
							],
						},
					},
					hasTheme: {
						$max: { $cond: [{ $eq: ["$data.type", "theme"] }, 1, 0] },
					},
					hasEditorAction: {
						$max: {
							$cond: [
								{
									$or: [
										{ $eq: ["$data.type", "tag"] },
										{ $and: [{ $eq: ["$data.type", "site"] }, { $in: ["$data.action", ["list", "read"]] }] },
									],
								},
								1,
								0,
							],
						},
					},
				},
			},
			{ $sort: { lastActivity: -1 } },
		]);

		const userIds = docs.map((d) => d._id);
		const personsResult = await getPersonsByIds(userIds);
		const persons = personsResult.success ? personsResult.data : [];

		const users: UserSummary[] = docs.map((doc) => {
			const person = persons.find((p) => p.id === doc._id);
			const isAdmin = doc.hasAdminLog === 1 || doc.hasSiteWrite === 1 || doc.hasTheme === 1;
			const isEditor = !isAdmin && doc.hasEditorAction === 1;
			return {
				userId: doc._id,
				name: person?.name ?? doc._id,
				lastActivity: doc.lastActivity,
				role: isAdmin ? "admin" : isEditor ? "editor" : "public",
				actionCount: doc.actionCount,
			};
		});

		return { users };
	} catch (err) {
		await log.error("Failed to list users from logs", {
			type: "user",
			action: "list",
			error: { message: err instanceof Error ? err.message : "Unknown", stack: err instanceof Error ? err.stack : undefined },
		});
		return httpError.internal();
	}
}

export async function getUsersFromLogsAction(): Promise<{ users: UserSummary[]; success: boolean }> {
	const result = await getUsersFromLogs();
	if (result.error) return { users: [], success: false };
	return { users: result.users ?? [], success: true };
}
