import { listDatabaseSites } from "@/lib/database";
import { getKubernetesSites } from "@/lib/kubernetes";
import { TagModel } from "@/models/Tag";
import { isDatabaseSite, isKubernetesSite } from "@/types/site";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: Promise<{
		siteId: string;
	}>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
	try {

		const { siteId } = await params;

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

		const foundSite = allSites.find((site) => site.id === siteId);
		if (!foundSite) {
			return NextResponse.json(
				{ message: "Site not found" },
				{ status: 404 },
			);
		}

		const site = {
			id: foundSite.id,
			...(isKubernetesSite(foundSite) ? { title: foundSite.title, tagline: foundSite.tagline } : {}),
			infrastructure: foundSite.infrastructure,
			url: foundSite.url,
			tags: tags
				.filter((tag) => tag.sites.includes(foundSite.id)).map((tag) => ({
					id: tag.id,
					nameFr: tag.nameFr,
					nameEn: tag.nameEn,
					urlFr: tag.urlFr,
					urlEn: tag.urlEn,
					type: tag.type,
				})),
			createdAt: foundSite.createdAt,
		};

		return NextResponse.json(site, { status: 200 });
	} catch (error) {
		console.error("Error retrieving sites:", error);
		return NextResponse.json(
			{ message: "Internal Server Error" },
			{ status: 500 },
		);
	}
}


