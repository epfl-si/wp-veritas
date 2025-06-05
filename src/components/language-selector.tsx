'use client';
import { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { setUserLocale } from '@/services/locale';
import { useLocale } from 'next-intl';
import React, { useTransition } from 'react';

export const LanguageSelector: React.FC = () => {
	const locale = useLocale();

	const [isPending, startTransition] = useTransition();

	function changeLocale(value: string) {
		const locale = value as Locale;
		startTransition(() => {
			setUserLocale(locale);
		});
	}

	return (
		<nav className="ml-auto flex items-center space-x-4 text-sm sm:text-base">
			<ul className="flex items-center space-x-1">
				<li>
					<button onClick={() => changeLocale('fr')} className={cn('cursor-pointer font-bold', isPending && 'pointer-events-none', locale === 'fr' ? 'text-red-500' : 'hover:text-gray-400 text-gray-300')}>
						FR
					</button>
				</li>
				<span className="border-l-2 border-solid h-4 w-1 border-gray-300"></span>
				<li>
					<button onClick={() => changeLocale('en')} className={cn('cursor-pointer -ml-0.5 font-bold', isPending && 'pointer-events-none', locale === 'en' ? 'text-red-500' : 'hover:text-gray-400 text-gray-300')}>
						EN
					</button>
				</li>
			</ul>
		</nav>
	);
};
