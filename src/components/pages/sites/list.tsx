'use client';
import React from 'react';
import { SiteType } from '@/types/site';
import { FileText, GlobeIcon, Info, Pencil, Tags, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const SitesList: React.FC<{ sites: SiteType[] }> = ({ sites }) => {
	const t = useTranslations('sites.list');

	return (
		<div className="w-full flex-1 flex flex-col h-full">
			<div className="p-6 pb-4 flex-shrink-0">
				<h1 className="text-3xl font-bold">{t('title')}</h1>
			</div>
			<div className="flex-1 px-6 pb-0 overflow-hidden">
				<div className="h-full flex flex-col">
					<div className="flex-shrink-0 border-b">
						<table className="min-w-full">
							<thead>
								<tr>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Titre
									</th>
									<th scope="col" className="px-6 py-3 w-80 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
						</table>
					</div>
					<div className="flex-1 overflow-y-auto">
						<table className="min-w-full mb-4">
							<tbody className="bg-white divide-y divide-gray-200">
								{sites.map((site) => (
									<tr key={site.id} className="hover:bg-gray-50 transition-colors duration-150">
										<td className="px-6 py-4">
											<a href={site.url} className="flex items-center gap-2 font-medium text-blue-600 hover:underline group" target="_blank" rel="noopener noreferrer">
												<GlobeIcon className="size-5 flex-shrink-0" />
												<span className="text-sm font-medium truncate">{site.url}</span>
											</a>
										</td>

										<td className="px-6 py-3.5 w-80">
											<div className="flex gap-2 items-center">
												<Button variant="outline" size="sm" className="p-1 w-8 h-8" asChild>
													<Link href={`/info?s=${site.url}`}>
														<Info className="size-4" />
													</Link>
												</Button>

												<Button variant="outline" size="sm" className="p-1 w-8 h-8">
													<FileText className="size-4" />
												</Button>

												<Button variant="outline" size="sm" className="p-1 w-8 h-8" asChild>
													<Link href={`/edit/${site.id}`}>
														<Pencil className="size-4" />
													</Link>
												</Button>

												<Button variant="outline" size="sm" className="p-1 w-8 h-8" asChild>
													<Link href={`/site-tags/${site.id}`}>
														<Tags className="size-4" />
													</Link>
												</Button>

												<Button variant="outline" size="sm" className="p-1 w-8 h-8">
													<GlobeIcon className="size-4" />
												</Button>

												<Button variant="destructive" size="sm" className="p-1 w-8 h-8">
													<Trash2 className="size-4" />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};
