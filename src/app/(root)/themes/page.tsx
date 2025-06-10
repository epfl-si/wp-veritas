'use server';

import { ThemesList } from '@/components/pages/themes/list';
import { THEMES } from '@/constants/theme';

export default async function ThemesListPage() {
	const themes = Object.values(THEMES);

	return <ThemesList themes={themes} />;
}
