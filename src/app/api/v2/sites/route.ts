import { listDatabaseSites } from "@/lib/database";
import { getKubernetesSites } from "@/lib/kubernetes";
import { ensureSlashAtEnd } from "@/lib/utils";
import { TagModel } from "@/models/Tag";
import { isDatabaseSite, isKubernetesSite } from "@/types/site";
import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/redis";
import db from "@/lib/mongo";

/**
 * @swagger
 * /api/v2/sites:
 *   get:
 *     summary: Retrieve all sites with optional filtering
 *     description: Fetches all sites from Kubernetes and database, merging them and including their tags. Supports filtering by tagged status and site URL.
 *     tags:
 *       - Sites
 *     parameters:
 *       - in: query
 *         name: tagged
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter sites by whether they have tags or not. Use 'true' to get only sites with tags, 'false' for sites without tags.
 *         example: true
 *       - in: query
 *         name: siteUrl
 *         schema:
 *           type: string
 *           format: uri
 *         required: false
 *         description: Filter sites by exact URL match (should be URL encoded).
 *         example: "https%3A//example.com"
 *     responses:
 *       200:
 *         description: A list of sites retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the site.
 *                     example: "site-123"
 *                   title:
 *                     type: string
 *                     description: Title of the site (only for Kubernetes sites).
 *                     example: "My Blog"
 *                   tagline:
 *                     type: string
 *                     description: Tagline of the site (only for Kubernetes sites).
 *                     example: "A personal blog about technology"
 *                   infrastructure:
 *                     type: string
 *                     description: Infrastructure type of the site.
 *                     enum: ["kubernetes", "database"]
 *                     example: "kubernetes"
 *                   url:
 *                     type: string
 *                     format: uri
 *                     description: URL of the site.
 *                     example: "https://myblog.example.com"
 *                   tags:
 *                     type: array
 *                     description: List of tags associated with the site.
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Unique identifier for the tag.
 *                           example: "507f1f77bcf86cd799439011"
 *                         nameFr:
 *                           type: string
 *                           description: French name of the tag.
 *                           example: "Technologie"
 *                         nameEn:
 *                           type: string
 *                           description: English name of the tag.
 *                           example: "Technology"
 *                         urlFr:
 *                           type: string
 *                           description: French URL slug for the tag.
 *                           example: "technologie"
 *                         urlEn:
 *                           type: string
 *                           description: English URL slug for the tag.
 *                           example: "technology"
 *                         type:
 *                           type: string
 *                           description: Type or category of the tag.
 *                           example: "category"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Creation timestamp of the site.
 *                     example: "2024-01-15T10:30:00.000Z"
 *                 required:
 *                   - id
 *                   - infrastructure
 *                   - url
 *                   - tags
 *                   - createdAt
 *                 example:
 *                   id: "site-123"
 *                   title: "My Tech Blog"
 *                   tagline: "Exploring the latest in technology"
 *                   infrastructure: "kubernetes"
 *                   url: "https://techblog.example.com"
 *                   tags:
 *                     - id: "507f1f77bcf86cd799439011"
 *                       nameFr: "Technologie"
 *                       nameEn: "Technology"
 *                       urlFr: "technologie"
 *                       urlEn: "technology"
 *                       type: "category"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
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

export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		const { searchParams } = new URL(request.url);
		const taggedParam = searchParams.get("tagged");
		const siteUrlParam = searchParams.get("siteUrl");

		const taggedFilter = taggedParam ? taggedParam.toLowerCase() === "true" : null;
		const siteUrlFilter = siteUrlParam ? ensureSlashAtEnd(decodeURIComponent(siteUrlParam)) : null;

		await db.connect();

		const allSites = await withCache("api-sites", async () => {
			const [kubernetesResult, databaseResult, tags] = await Promise.all([
				getKubernetesSites(),
				listDatabaseSites(),
				TagModel.find({}).select("id nameFr nameEn urlFr urlEn type sites").lean(),
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

			const tagsMap = new Map();
			tags.forEach((tag) => {
				tag.sites?.forEach((siteId: string) => {
					if (!tagsMap.has(siteId)) {
						tagsMap.set(siteId, []);
					}
					tagsMap.get(siteId).push({
						id: tag.id,
						nameFr: tag.nameFr,
						nameEn: tag.nameEn,
						urlFr: tag.urlFr,
						urlEn: tag.urlEn,
						type: tag.type,
					});
				});
			});

			return allSites.map((site) => ({
				id: site.id,
				...(isKubernetesSite(site) ? { title: site.title, tagline: site.tagline } : {}),
				infrastructure: site.infrastructure,
				url: site.url,
				tags: tagsMap.get(site.id) || [],
				createdAt: site.createdAt,
			}));
		}, 480); // 8 minutes cache

		let filteredSites = allSites;

		if (siteUrlFilter) {
			filteredSites = filteredSites.filter((site) => site.url === siteUrlFilter);
		}

		if (taggedFilter !== null) {
			if (taggedFilter) {
				filteredSites = filteredSites.filter((site) => site.tags.length > 0);
			} else {
				filteredSites = filteredSites.filter((site) => site.tags.length === 0);
			}
		}

		return NextResponse.json(filteredSites, { status: 200 });
	} catch (error) {
		console.error("Error retrieving sites:", error);
		return NextResponse.json(
			{ message: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
