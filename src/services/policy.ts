import { type AppAbility, defineAbilityFor } from "@/lib/ability";
import { getUserGroups } from "./auth";

export async function getAbility(): Promise<AppAbility> {
	const groups = await getUserGroups();
	return defineAbilityFor(groups);
}
