import NextAuth, { Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { getPermissions } from "./policy";

const decodeJWT = (token: string) => JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		MicrosoftEntraID({
			clientId: process.env.AUTH_MICROSOFT_ENTRA_ID!,
			clientSecret: process.env.AUTH_MICROSOFT_ENTRA_SECRET!,
			issuer: process.env.AUTH_MICROSOFT_ENTRA_ISSUER + "/v2.0",
			authorization: {
				params: {
					scope: "openid email profile",
				},
			},
		}),
	],
	callbacks: {
		authorized: async ({ auth }) => !!auth,
		jwt: async ({ token, account }: { token: JWT; account?: Account | null }) => {
			try {
				if (account?.access_token && account?.id_token) {
					const accessToken = decodeJWT(account.access_token);
					const idToken = decodeJWT(account.id_token);

					return {
						...token,
						access_token: account.access_token,
						expires_at: account.expires_at,
						oid: idToken.oid || "",
						tid: accessToken.tid || "",
						email: idToken.email,
						picture: token.picture || "",
						uniqueid: idToken.uniqueid,
						username: idToken.gaspar || "",
						groups: idToken.groups || [],
						name: `${idToken.given_name ?? ""} ${idToken.family_name ?? ""}`.trim(),
					};
				}

				const accessToken = decodeJWT(token.access_token);
				if (Date.now() < accessToken.exp * 1000) {
					return token;
				}

				return { ...token, error: "TokenExpired" };
			} catch (error) {
				console.error("Error processing tokens:", error);
				return { ...token, error: "TokenProcessingError" };
			}
		},
		session: async ({ session, token }) => {
			const groups = [...(token?.groups || []), "public"];
			const permissions = await getPermissions(groups);
			return {
				...session,
				user: {
					email: token?.email || session.user?.email || "",
					name: token?.name || "",
					image: session.user?.image || null,
					userId: token?.uniqueid || "",
					username: token?.username || "",
					oid: token.oid || "",
					tid: token.tid || "",
					groups: groups,
					permissions: permissions,
				},
			};
		},
	},
	session: {
		strategy: "jwt",
	},
	pages: {
		signIn: "/api/auth/",
	},
});

export async function getUser(): Promise<User> {
	const session = await auth();
	if (!session?.user) {
		throw new Error("User not authenticated");
	}
	return session.user;
}

export async function getUserGroups(): Promise<string[]> {
	const user = await getUser();
	return user.groups || [];
}

export async function getUserPermissions(): Promise<string[]> {
	const user = await getUser();
	return user.permissions || [];
}
