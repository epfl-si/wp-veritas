import { type NextRequest, NextResponse } from "next/server";
import { type AppAbility, defineAbilityFor } from "@/lib/ability";
import { auth } from "@/services/auth";

type RouteCheck = (ability: AppAbility) => boolean;

const STATIC_ROUTES: Record<string, RouteCheck> = {
	"/": (a) => a.can("list", "Site"),
	"/new": (a) => a.can("create", "Site"),
	"/search": (a) => a.can("search", "Site"),
	"/tags": (a) => a.can("list", "Tag"),
	"/tags/add": (a) => a.can("create", "Tag"),
	"/themes": (a) => a.can("list", "Theme"),
	"/logs": (a) => a.can("list", "Log"),
	"/api-docs": (a) => a.can("list", "Site"),
	"/users": (a) => a.can("list", "User"),
	"/redirections": (a) => a.can("list", "Redirection"),
};

const DYNAMIC_ROUTES: { pattern: RegExp; check: RouteCheck }[] = [
	{ pattern: /^\/tags\/[^/]+\/edit$/, check: (a) => a.can("update", "Tag") },
	{ pattern: /^\/sites\/[^/]+\/edit$/, check: (a) => a.can("update", "Site") },
	{ pattern: /^\/sites\/[^/]+\/tags$/, check: (a) => a.can("associate", "Tag") },
];

const ROUTE_PRIORITY = ["/", "/search", "/tags", "/themes", "/new", "/tags/add", "/logs", "/api-docs"];

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

function logRequest(method: string, pathname: string, ip: string, userAgent: string) {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] ${method} ${pathname} - IP: ${ip} - User-Agent: ${userAgent}`;
	console.info(logMessage);
}

function hasAbilityForRoute(pathname: string, ability: AppAbility): boolean {
	const staticCheck = STATIC_ROUTES[pathname];
	if (staticCheck) return staticCheck(ability);

	for (const { pattern, check } of DYNAMIC_ROUTES) {
		if (pattern.test(pathname)) {
			return check(ability);
		}
	}

	return false;
}

function getFirstAuthorizedRoute(ability: AppAbility): string | null {
	for (const route of ROUTE_PRIORITY) {
		if (hasAbilityForRoute(route, ability)) {
			return route;
		}
	}
	return null;
}

export default async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const ip = getClientIP(req);

	if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.match(/\.(png|jpg|jpeg|gif|svg|css|js|ico)$/)) {
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
		const ability = defineAbilityFor(userGroups);

		if (!hasAbilityForRoute(pathname, ability)) {
			if (!ability.can("list", "Site")) {
				const authorizedRoute = getFirstAuthorizedRoute(ability);
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
