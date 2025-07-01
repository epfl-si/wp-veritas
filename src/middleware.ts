import { auth } from "@/services/auth";
import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/constants/permissions";
import { getPermissions } from "@/services/policy";

const ROUTE_PERMISSIONS: Record<string, string> = {
	"/": PERMISSIONS.SITES.LIST,
	"/new": PERMISSIONS.SITES.CREATE,
	"/search": PERMISSIONS.SITES.SEARCH,
	"/tags": PERMISSIONS.TAGS.LIST,
	"/tags/add": PERMISSIONS.TAGS.CREATE,
	"/themes": PERMISSIONS.THEME.LIST,
	"/logs": PERMISSIONS.LOGS.LIST,
	"/api-docs": PERMISSIONS.SITES.LIST,
};

const DYNAMIC_ROUTES = [
	{ pattern: /^\/tags\/[^\/]+\/edit$/, permission: PERMISSIONS.TAGS.UPDATE },
	{ pattern: /^\/sites\/[^\/]+\/edit$/, permission: PERMISSIONS.SITES.UPDATE },
	{ pattern: /^\/sites\/[^\/]+\/tags$/, permission: PERMISSIONS.TAGS.ASSOCIATE },
];

const ROUTE_PRIORITY = [
	"/",
	"/search",
	"/tags",
	"/themes",
	"/new",
	"/tags/add",
	"/logs",
	"/api-docs",
];

function getClientIP(req: NextRequest): string {
	const forwarded = req.headers.get("x-forwarded-for");
	const realIP = req.headers.get("x-real-ip");
	const cfConnectingIP = req.headers.get("cf-connecting-ip");

	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	if (realIP) {
		return realIP;

	}
	if (cfConnectingIP) {
		return cfConnectingIP;
	}

	return "unknown";
}

function logRequest(
	method: string,
	pathname: string,
	ip: string,
	userAgent: string,
) {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] ${method} ${pathname} - IP: ${ip} - User-Agent: ${userAgent}`;
	console.info(logMessage);
}

function hasPermissionForRoute(pathname: string, userPermissions: string[]): boolean {
	if (ROUTE_PERMISSIONS[pathname]) {
		return userPermissions.includes(ROUTE_PERMISSIONS[pathname]);
	}

	for (const { pattern, permission } of DYNAMIC_ROUTES) {
		if (pattern.test(pathname)) {
			return userPermissions.includes(permission);
		}
	}

	return false;
}

function getFirstAuthorizedRoute(userPermissions: string[]): string | null {
	for (const route of ROUTE_PRIORITY) {
		if (hasPermissionForRoute(route, userPermissions)) {
			return route;
		}
	}
	return null;
}

export default async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const ip = getClientIP(req);

	if (pathname.startsWith("/api/") ||
		pathname.startsWith("/_next/") ||
		pathname.match(/\.(png|jpg|jpeg|gif|svg|css|js|ico)$/)) {
		logRequest(req.method, pathname, ip, req.headers.get("user-agent") || "unknown");
		return NextResponse.next();
	}

	const session = await auth();

	if (!session?.user) {
		const authUrl = new URL("/api/auth", req.url);
		authUrl.searchParams.set("callbackUrl", req.url);
		logRequest(req.method, pathname, ip, req.headers.get("user-agent") || "unknown");
		return NextResponse.redirect(authUrl);
	}

	try {
		const userGroups = [...(session.user.groups || []), "public"];
		const userPermissions = await getPermissions(userGroups);

		if (!hasPermissionForRoute(pathname, userPermissions)) {
			if (!userPermissions.includes(PERMISSIONS.SITES.LIST)) {
				const authorizedRoute = getFirstAuthorizedRoute(userPermissions);
				if (authorizedRoute) {
					logRequest(req.method, pathname, ip, req.headers.get("user-agent") || "unknown");
					return NextResponse.redirect(new URL(authorizedRoute, req.url));
				}
			}

			logRequest(req.method, pathname, ip, req.headers.get("user-agent") || "unknown");
			return NextResponse.rewrite(new URL("/not-found", req.url));
		}

		logRequest(req.method, pathname, ip, req.headers.get("user-agent") || "unknown");
		return NextResponse.next();

	} catch (error) {
		console.error("Erreur middleware:", error);
		logRequest(req.method, pathname, ip, req.headers.get("user-agent") || "unknown");
		return new NextResponse(null, { status: 500 });
	}
}

export const config = {
	matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z]+$).*)"],
};
