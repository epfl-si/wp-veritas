import { useZodErrorMessages } from '@/hooks/zod';
import { z } from 'zod';

export interface ThemeType {
	id: string;
	name: string;
}

export const ThemeSchema = (errorMessages: ReturnType<typeof useZodErrorMessages>) => {
	return z.object({
		name: z
			.string({
				required_error: errorMessages.required_error,
				invalid_type_error: errorMessages.invalid_type_error,
			})
			.min(1, {
				message: errorMessages.too_small(1),
			}),
	});
};

export type ThemeFormType = z.infer<ReturnType<typeof ThemeSchema>>;
