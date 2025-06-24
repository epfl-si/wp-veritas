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

/**
 * @swagger
 * /api/v1/sites/{siteId}:
 *   get:
 *     summary: Retrieve a specific site by ID
 *     description: Fetches a single site by its unique identifier from both Kubernetes and database sources, merging the data and including associated tags.
 *     tags:
 *       - Sites
 *     parameters:
 *       - in: path
 *         name: siteId
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique identifier of the site to retrieve.
 *         example: "site-123"
 *     responses:
 *       200:
 *         description: Site retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier for the site.
 *                   example: "site-123"
 *                 title:
 *                   type: string
 *                   description: Title of the site (only present for Kubernetes sites).
 *                   example: "My Tech Blog"
 *                 tagline:
 *                   type: string
 *                   description: Tagline of the site (only present for Kubernetes sites).
 *                   example: "Exploring the latest in technology"
 *                 infrastructure:
 *                   type: string
 *                   description: Infrastructure type of the site.
 *                   enum: ["kubernetes", "database"]
 *                   example: "kubernetes"
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: URL of the site.
 *                   example: "https://techblog.example.com"
 *                 tags:
 *                   type: array
 *                   description: List of tags associated with the site.
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the tag.
 *                         example: "507f1f77bcf86cd799439011"
 *                       name_fr:
 *                         type: string
 *                         description: French name of the tag.
 *                         example: "Technologie"
 *                       name_en:
 *                         type: string
 *                         description: English name of the tag.
 *                         example: "Technology"
 *                       url_fr:
 *                         type: string
 *                         description: French URL slug for the tag.
 *                         example: "technologie"
 *                       url_en:
 *                         type: string
 *                         description: English URL slug for the tag.
 *                         example: "technology"
 *                       type:
 *                         type: string
 *                         description: Type or category of the tag.
 *                         example: "category"
 *                     required:
 *                       - id
 *                       - name_fr
 *                       - name_en
 *                       - url_fr
 *                       - url_en
 *                       - type
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Creation timestamp of the site.
 *                   example: "2024-01-15T10:30:00.000Z"
 *               required:
 *                 - id
 *                 - infrastructure
 *                 - url
 *                 - tags
 *                 - createdAt
 *               example:
 *                 id: "site-123"
 *                 title: "My Tech Blog"
 *                 tagline: "Exploring the latest in technology"
 *                 infrastructure: "kubernetes"
 *                 url: "https://techblog.example.com"
 *                 tags:
 *                   - id: "507f1f77bcf86cd799439011"
 *                     name_fr: "Technologie"
 *                     name_en: "Technology"
 *                     url_fr: "technologie"
 *                     url_en: "technology"
 *                     type: "category"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Site not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Site not found"
 *               required:
 *                 - message
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 *               required:
 *                 - message
 */

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
					name_fr: tag.nameFr,
					name_en: tag.nameEn,
					url_fr: tag.urlFr,
					url_en: tag.urlEn,
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


