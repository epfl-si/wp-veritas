"use client";

import { SessionProvider as NextAuthSessionProvider, type SessionProviderProps } from "next-auth/react";
import * as React from "react";

export function SessionProvider({ children, session }: SessionProviderProps) {
	return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
