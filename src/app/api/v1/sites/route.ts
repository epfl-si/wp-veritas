import { listDatabaseSites } from "@/lib/database";
import { getKubernetesSites } from "@/lib/kubernetes";
import { TagModel } from "@/models/Tag";
import { isDatabaseSite, isKubernetesSite } from "@/types/site";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
	try {
		const [kubernetesResult, databaseResult] = await Promise.all([
			getKubernetesSites(), 
			listDatabaseSites(),
		]);
    
		const kubernetesSites = kubernetesResult.sites || [];
		const databaseSites = databaseResult.sites || [];
    
		const databaseSiteMap = new Map(databaseSites.map((site) => [site.id, site]));
    
		const mergedKubernetesSites = kubernetesSites.map((kubernetesSite) => {
			if (isKubernetesSite(kubernetesSite)) {
				const dbSite = databaseSiteMap.get(kubernetesSite.id);
				if (dbSite && isDatabaseSite(dbSite)) {
					databaseSiteMap.delete(kubernetesSite.id);
				}
			}
			return kubernetesSite;
		});
    
		const remainingDatabaseSites = Array.from(databaseSiteMap.values());
		const allSites = [...mergedKubernetesSites, ...remainingDatabaseSites];

		const tags = await TagModel.find({}, { _id: 0, __v: 0 });
    
		const sites = allSites.map((site) => ({
			id: site.id,
			...(isKubernetesSite(site) ? { title: site.title, tagline: site.tagline } : {}),
			infrastructure: site.infrastructure,
			url: site.url,
			tags: tags
				.filter((tag) => tag.sites.includes(site.id)).map((tag) => ({
					id: tag.id,
					name_fr: tag.nameFr,
					name_en: tag.nameEn,
					url_fr: tag.urlFr,
					url_en: tag.urlEn,
					type: tag.type,
				})),
			createdAt: site.createdAt,
		}));
    
		return NextResponse.json(sites, { status: 200 });
	} catch (error) {
		console.error("Error retrieving sites:", error);
		return NextResponse.json(
			{ message: "Internal Server Error" }, 
			{ status: 500 },
		);
	}
}
