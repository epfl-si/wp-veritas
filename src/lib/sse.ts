const SSE_KEEPALIVE_MS = 15000;

const SSE_HEADERS = {
	"Content-Type": "text/event-stream",
	"Cache-Control": "no-cache, no-transform",
	Connection: "keep-alive",
	"X-Accel-Buffering": "no",
} as const;

export interface SSEConnection {
	send(event: string, data: unknown): void;
	comment(text: string): void;
	close(): void;
}

export type SSETeardown = () => void;
export type SSESetup = (connection: SSEConnection) => SSETeardown | undefined | Promise<SSETeardown | undefined>;

export function createSSEStream(request: Request, setup: SSESetup): Response {
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const encoder = new TextEncoder();
			let closed = false;
			let teardown: SSETeardown | undefined;
			let keepAlive: ReturnType<typeof setInterval>;

			const cleanup = () => {
				if (closed) return;
				closed = true;
				clearInterval(keepAlive);
				request.signal.removeEventListener("abort", cleanup);
				try {
					teardown?.();
				} catch {}
				try {
					controller.close();
				} catch {}
			};

			const write = (chunk: string) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					cleanup();
				}
			};

			const connection: SSEConnection = {
				send: (event, data) => write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
				comment: (text) => write(`: ${text}\n\n`),
				close: cleanup,
			};

			keepAlive = setInterval(() => connection.comment("keepalive"), SSE_KEEPALIVE_MS);
			request.signal.addEventListener("abort", cleanup);

			try {
				teardown = await setup(connection);
			} catch {
				cleanup();
			}
		},
	});

	return new Response(stream, { headers: SSE_HEADERS });
}
