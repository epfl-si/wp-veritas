'use client';
import { useTranslations } from 'next-intl';
import { GalleryVerticalEnd, House, CirclePlus, Bookmark, BadgeInfo, Palette } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User } from 'next-auth';
import { PERMISSIONS } from '@/constants/permissions';
import pjson from '../../package.json';

export const Sidebar: React.FC<{ user: User }> = ({ user }) => {
	const pathname = usePathname();
	const t = useTranslations('sidebar');

	const navItems = [
		{
			href: '/',
			label: t('home'),
			icon: House,
			permissions: PERMISSIONS.SITES.LIST,
		},
		{
			href: '/new',
			label: t('new'),
			icon: CirclePlus,
			permissions: PERMISSIONS.SITES.CREATE,
		},
		{
			href: '/search',
			label: t('info'),
			icon: BadgeInfo,
			permissions: PERMISSIONS.SITES.SEARCH,
		},
		{
			href: '/tags',
			label: t('tags'),
			icon: Bookmark,
			permissions: PERMISSIONS.TAGS.LIST,
		},
		{
			href: '/themes',
			label: t('themes'),
			icon: Palette,
			permissions: PERMISSIONS.THEME.LIST,
		},
		// {
		// 	href: '/trash',
		// 	label: t('trash'),
		// 	icon: Trash2,
		// 	permissions: PERMISSIONS.SITES.DELETE,
		// },
		// {
		// 	href: '/redirections',
		// 	label: t('redirections'),
		// 	icon: LinkIcon,
		// 	permissions: PERMISSIONS.REDIRECTIONS.LIST,
		// },
		{
			href: '/logs',
			label: t('logs'),
			icon: GalleryVerticalEnd,
			permissions: PERMISSIONS.LOGS.LIST,
		},
	];

	const filteredNavItems = navItems.filter((item) => {
		return !item.permissions || user.permissions?.includes(item.permissions);
	});

	return (
		<aside className="max-w-72 flex-1 space-y-2 border-r p-4 flex flex-col justify-between">
			<nav className="space-y-2 w-full">
				{filteredNavItems.map((item) => (
					<Link key={item.href} href={item.href} className={cn('px-6 py-3 rounded-lg flex text-primary-secondary font-medium w-full items-center justify-start gap-2', pathname === item.href ? 'text-primary font-semibold' : 'hover:bg-muted/80')}>
						<item.icon className="w-5 h-5" />
						{item.label}
					</Link>
				))}
			</nav>
			<p className="text-xs text-center text-gray-500/70 mt-4">
				<a href="https://go.epfl.ch/fsd">ISAS-FSD</a>&nbsp;&mdash;&nbsp;<a href="https://github.com/epfl-si/wp-veritas">{pjson.version}</a>
			</p>
		</aside>
	);
};
