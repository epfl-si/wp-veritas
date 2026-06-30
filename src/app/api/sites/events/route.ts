import type { NextRequest } from "next/server";
import { watchKubernetesSites } from "@/lib/kubernetes";
import { createSSEStream } from "@/lib/sse";
import { auth } from "@/services/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user) return new Response("Unauthorized", { status: 401 });

	return createSSEStream(request, async (connection) => {
		const watch = await watchKubernetesSites(
			(event) => connection.send("site", event),
			() => connection.close(),
		);
		return () => watch.abort();
	});
}
