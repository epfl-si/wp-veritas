import { listDatabaseSites } from "@/lib/database";
import { getKubernetesSiteExtraInfo, getKubernetesSites } from "@/lib/kubernetes";
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
 * /api/v2/sites/{siteId}:
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
 *               required:
 *                 - id
 *                 - infrastructure
 *                 - url
 *                 - tags
 *                 - createdAt
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
 *                     required:
 *                       - id
 *                       - nameFr
 *                       - nameEn
 *                       - urlFr
 *                       - urlEn
 *                       - type
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the tag.
 *                         example: "507f1f77bcf86cd799439011"
 *                       nameFr:
 *                         type: string
 *                         description: French name of the tag.
 *                         example: "Technologie"
 *                       nameEn:
 *                         type: string
 *                         description: English name of the tag.
 *                         example: "Technology"
 *                       urlFr:
 *                         type: string
 *                         description: French URL slug for the tag.
 *                         example: "technologie"
 *                       urlEn:
 *                         type: string
 *                         description: English URL slug for the tag.
 *                         example: "technology"
 *                       type:
 *                         type: string
 *                         description: Type or category of the tag.
 *                         example: "category"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Creation timestamp of the site.
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 kubernetesExtraInfo:
 *                   type: object
 *                   description: Additional info for Kubernetes sites.
 *                   properties:
 *                     siteId:
 *                       type: string
 *                       description: Unique identifier for the Kubernetes site.
 *                       example: "site-123"
 *                     ingressName:
 *                       type: string
 *                       description: Name of the Kubernetes ingress resource.
 *                       example: "www"
 *                     databaseName:
 *                       type: string
 *                       description: Name of the associated database.
 *                       example: "wp-db-www"
 *                     databaseRef:
 *                       type: string
 *                       description: Reference to the database resource.
 *                       example: "mariadb-01"
 *                     wordpressSiteName:
 *                       type: string
 *                       description: Name of the WordPress site.
 *                       example: "www"
 *       404:
 *         description: Site not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Site not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
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
			...(isKubernetesSite(foundSite) ? { kubernetesExtraInfo: await getKubernetesSiteExtraInfo(foundSite.id) } : {}),
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


