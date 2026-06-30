"use client";
import { useEffect, useRef } from "react";

export function useServerEvents<E extends Record<string, unknown>>(url: string, handlers: { [K in keyof E]: (data: E[K]) => void }, enabled = true): void {
	const handlersRef = useRef(handlers);
	handlersRef.current = handlers;

	useEffect(() => {
		if (!enabled) return;

		const source = new EventSource(url);
		const events = Object.keys(handlersRef.current) as (keyof E & string)[];

		const bound = events.map((event) => {
			const listener = (e: MessageEvent) => handlersRef.current[event](JSON.parse(e.data));
			source.addEventListener(event, listener);
			return { event, listener };
		});

		return () => {
			for (const { event, listener } of bound) source.removeEventListener(event, listener);
			source.close();
		};
	}, [url, enabled]);
}
