import { Session } from 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: User;
		expires: string;
	}

	interface User {
		username: string;
		name: string;
		email: string;
		image: string | null;
		employeeId: string;
		groups: string[];
		permissions: string[];
	}
}

declare module 'next-auth/jwt' {
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
