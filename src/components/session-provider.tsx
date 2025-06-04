'use client';

import * as React from 'react';
import { SessionProvider as NextAuthSessionProvider, type SessionProviderProps } from 'next-auth/react';

export function SessionProvider({ children, session }: SessionProviderProps) {
	return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
