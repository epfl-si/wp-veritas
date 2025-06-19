"use server";

import { ThemeList } from "@/components/pages/themes/list";
import { THEMES } from "@/constants/theme";

export default async function ThemeListPage() {
	const themes = Object.values(THEMES);

	return <ThemeList themes={themes} />;
}
