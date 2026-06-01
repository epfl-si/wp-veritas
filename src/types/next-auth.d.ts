import type { DefaultSession } from "next-auth";

declare module "next-auth" {
	interface Session {
		user: {
			username: string;
			userId: string;
			groups: string[];
		} & DefaultSession["user"];
		expires: string;
	}

	interface User {
		username?: string;
		userId?: string;
		groups?: string[];
	}
}

declare module "next-auth/jwt" {
	interface JWT extends DefaultJWT {
		access_token: string;
		expires_at?: number;
		oid?: string;
		tid?: string;
		email?: string;
		name?: string;
		picture?: string;
		uniqueid?: string;
		groups?: string[];
		username?: string;
		error?: string;
	}
}
