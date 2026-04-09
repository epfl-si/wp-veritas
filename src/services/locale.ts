"use server";

import { cookies } from "next/headers";
import { defaultLocale, type Locale } from "@/i18n/config";

const COOKIE_NAME = "locale";

export async function getUserLocale() {
	const userCookies = await cookies();
	return userCookies.get(COOKIE_NAME)?.value || defaultLocale;
}

export async function setUserLocale(locale: Locale) {
	const userCookies = await cookies();
	userCookies.set(COOKIE_NAME, locale);
}
