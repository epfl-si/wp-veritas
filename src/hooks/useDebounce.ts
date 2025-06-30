import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: never[]) => void>(
	callback: T,
	delay: number,
): T {
	const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

	const debouncedCallback = ((...args: Parameters<T>) => {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		const timer = setTimeout(() => {
			callback(...args);
		}, delay);

		setDebounceTimer(timer);
	}) as T;

	return debouncedCallback;
}