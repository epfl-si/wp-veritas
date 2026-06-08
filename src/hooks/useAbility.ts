"use client";
import { useSession } from "next-auth/react";
import { type AppAbility, defineAbilityFor } from "@/lib/ability";

export function useAbility(): AppAbility {
	const { data: session } = useSession();
	return defineAbilityFor(session?.user?.groups ?? []);
}
