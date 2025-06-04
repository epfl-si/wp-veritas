import NextAuth, { Account } from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

const decodeJWT = (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		MicrosoftEntraID({
			clientId: process.env.AUTH_MICROSOFT_ENTRA_ID,
			clientSecret: process.env.AUTH_MICROSOFT_ENTRA_SECRET,
			issuer: process.env.AUTH_MICROSOFT_ENTRA_ISSUER,
			authorization: {
				params: {
					scope: 'openid email profile',
				},
			},
		}),
	],
	callbacks: {
		authorized: async ({ auth }) => !!auth,
		jwt: async ({ token, account }) => {
			if (account) {
				const accessToken = decodeJWT(account.access_token as string);
				const idToken = decodeJWT(account.id_token as string);

				return {
					...token,
					access_token: account.access_token,
					expires_at: account.expires_at,
					refresh_token: account.refresh_token,
					roles: accessToken.roles || [],
					oid: idToken.oid || '',
					tid: accessToken.tid || '',
				};
			}

			const accessToken = decodeJWT(token.access_token as string);
			if (Date.now() < accessToken.exp * 1000) {
				return token;
			}

			return { ...token, error: 'TokenExpired' };
		},
		session: async ({ session, token }) => {
			return {
				...session,
				error: token.error === 'TokenExpired' ? 'TokenExpired' : undefined,
				accessToken: token.access_token as string | undefined,
				refreshToken: token.refresh_token as string | undefined,
				roles: (token.roles as string[]) || [],
				oid: token.oid as string,
				tid: token.tid as string,
			};
		},
	},
	session: { strategy: 'jwt' },
	pages: { signIn: '/api/auth' },
});
