"use server";

import { defaultLocale, Locale } from "@/i18n/config";
import { cookies } from "next/headers";

const COOKIE_NAME = "locale";

export async function getUserLocale() {
	const userCookies = await cookies();
	return userCookies.get(COOKIE_NAME)?.value || defaultLocale;
}

export async function setUserLocale(locale: Locale) {
	const userCookies = await cookies();
	userCookies.set(COOKIE_NAME, locale);
}
