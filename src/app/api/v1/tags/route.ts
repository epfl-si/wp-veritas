import db from "@/lib/mongo";
import { TagModel } from "@/models/Tag";
import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/redis";

/**
 * @swagger
 * /api/v1/tags:
 *   get:
 *     summary: Retrieve all tags with optional type filtering
 *     description: Fetches all tags from the database with their multilingual properties. Optionally filter by tag type.
 *     tags:
 *       - Tags
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter tags by type (e.g., "category", "skill", "topic")
 *         example: "category"
 *     responses:
 *       200:
 *         description: A list of tags retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the tag.
 *                     example: "507f1f77bcf86cd799439011"
 *                   type:
 *                     type: string
 *                     description: Type or category of the tag.
 *                     example: "category"
 *                   name_fr:
 *                     type: string
 *                     description: French name of the tag.
 *                     example: "Technologie"
 *                   name_en:
 *                     type: string
 *                     description: English name of the tag.
 *                     example: "Technology"
 *                   url_fr:
 *                     type: string
 *                     description: French URL slug for the tag.
 *                     example: "technologie"
 *                   url_en:
 *                     type: string
 *                     description: English URL slug for the tag.
 *                     example: "technology"
 *             example:
 *               - id: "507f1f77bcf86cd799439011"
 *                 type: "category"
 *                 name_fr: "Technologie"
 *                 name_en: "Technology"
 *                 url_fr: "technologie"
 *                 url_en: "technology"
 *       404:
 *         description: No tags found in the database.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "No tags found"
 *       500:
 *         description: Internal server error occurred while retrieving tags.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		const { searchParams } = new URL(request.url);
		const typeFilter = searchParams.get("type");

		const allTags = await withCache("api-v1-tags", async () => {
			await db.connect();
			const tags = await TagModel.find({}, { __id: 0, __v: 0 });
			return tags.map((tag) => ({
				id: tag.id,
				type: tag.type,
				name_fr: tag.nameFr,
				name_en: tag.nameEn,
				url_fr: tag.urlFr,
				url_en: tag.urlEn,
			}));
		}, 480); // 8 minutes cache

		let filteredTags = allTags;

		if (typeFilter) {
			filteredTags = allTags.filter(tag => tag.type === typeFilter);
		}

		if (!filteredTags || filteredTags.length === 0) {
			return NextResponse.json(
				{ status: 404, message: "No tags found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(filteredTags, { status: 200 });
	} catch (error) {
		console.error("Error retrieving tags:", error);
		return NextResponse.json(
			{ status: 500, message: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
