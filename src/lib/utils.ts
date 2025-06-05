import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function ensureSlashAtEnd(path: string): string {
	return path.endsWith('/') ? path : `${path}/`;
}
