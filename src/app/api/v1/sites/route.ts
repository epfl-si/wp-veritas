import { listDatabaseSites } from "@/lib/database";
import { getKubernetesSites } from "@/lib/kubernetes";
import db from "@/lib/mongo";
import { TagModel } from "@/models/Tag";
import { isKubernetesSite } from "@/types/site";
import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/redis";
import { ensureSlashAtEnd } from "@/lib/utils";

/**
 * @swagger
 * /api/v1/sites:
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
 *         name: site_url
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
 *                   monitored:
 * 				      type: boolean
 * 				 	  description: Indicates if the site is monitored.
 * 				      example: true
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
 *                         name_fr:
 *                           type: string
 *                           description: French name of the tag.
 *                           example: "Technologie"
 *                         name_en:
 *                           type: string
 *                           description: English name of the tag.
 *                           example: "Technology"
 *                         url_fr:
 *                           type: string
 *                           description: French URL slug for the tag.
 *                           example: "technologie"
 *                         url_en:
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
 *                       name_fr: "Technologie"
 *                       name_en: "Technology"
 *                       url_fr: "technologie"
 *                       url_en: "technology"
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
		const taggedFilter = searchParams.get("tagged");
		const siteUrlFilter = searchParams.get("site_url") ? ensureSlashAtEnd(decodeURIComponent(searchParams.get("site_url")!)) : null;
		const hasTaggedFilter = searchParams.has("tagged");

		const sites = await withCache("api-v1-sites", async () => {
			const [[k8sResult, dbResult], tags] = await Promise.all([
				Promise.all([getKubernetesSites(), listDatabaseSites()]),
				db.connect().then(() => TagModel.find({}).select("sites id nameFr nameEn urlFr urlEn type").lean()),
			]);

			const k8sSites = k8sResult.sites || [];
			const dbSites = dbResult.sites || [];

			const tagMap = new Map();
			const siteMap = new Map();

			for (const tag of tags) {
				if (tag.sites?.length) {
					const tagObj = {
						id: tag.id,
						name_fr: tag.nameFr,
						name_en: tag.nameEn,
						url_fr: tag.urlFr,
						url_en: tag.urlEn,
						type: tag.type,
					};
					for (const siteId of tag.sites) {
						if (!tagMap.has(siteId)) {
							tagMap.set(siteId, []);
						}
						tagMap.get(siteId)!.push(tagObj);
					}
				}
			}

			[...dbSites, ...k8sSites].forEach(site => {
				const existing = siteMap.get(site.id);
				siteMap.set(site.id, {
					id: site.id,
					infrastructure: site.infrastructure,
					url: site.url,
					monitored: existing?.monitored ?? site.monitored,
					tags: tagMap.get(site.id) || [],
					createdAt: site.createdAt,
					...(isKubernetesSite(site) ? { title: site.title, tagline: site.tagline } : {}),
				});
			});

			return Array.from(siteMap.values());
		}, 480);

		const filtered = sites.filter(site =>
			(!siteUrlFilter || site.url === siteUrlFilter) &&
			(!hasTaggedFilter || (taggedFilter ? site.tags.length > 0 : site.tags.length === 0)),
		);

		return NextResponse.json(filtered);
	} catch (error) {
		console.error("Error retrieving sites:", error);
		return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
	}
}
