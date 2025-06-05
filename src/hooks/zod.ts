import { useTranslations } from 'next-intl';

export const useZodErrorMessages = () => {
	const t = useTranslations('validation');

	return {
		required_error: t('required'),
		invalid_type_error: t('invalid_type'),
		too_small: (min: number) => t('too_small', { min }),
		too_big: (max: number) => t('too_big', { max }),
		invalid_url: t('invalid_url'),
		invalid_string: t('invalid_string'),
		invalid_enum: (options: string[]) => t('invalid_enum', { options: options.join(', ') }),
	};
};
