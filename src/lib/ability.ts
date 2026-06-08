import { AbilityBuilder, createMongoAbility, type MongoAbility } from "@casl/ability";

export type Action = "manage" | "read" | "create" | "update" | "delete" | "list" | "search" | "associate" | "dissociate";
export type Subject = "Site" | "Tag" | "Log" | "Redirection" | "Theme" | "User" | "all";

export type AppAbility = MongoAbility<[Action, Subject]>;

export function defineAbilityFor(groups: string[]): AppAbility {
	const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

	if (groups.includes("wp-veritas-admins_AppGrpU")) {
		can("manage", "all");
	}

	if (groups.includes("wp-veritas-editors_AppGrpU")) {
		can(["list", "read"], "Site");
		can(["list", "read", "create", "update", "delete", "associate", "dissociate"], "Tag");
	}

	if (groups.includes("public")) {
		can("search", "Site");
	}

	return build();
}
