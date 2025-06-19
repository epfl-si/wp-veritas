import { THEMES } from "@/constants/theme";

export type ThemeType = (typeof THEMES)[keyof typeof THEMES];
