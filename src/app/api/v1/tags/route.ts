import db from "@/lib/mongo";
import { TagModel } from "@/models/Tag";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/tags:
 *   get:
 *     summary: Retrieve all tags
 *     description: Fetches all tags from the database with their multilingual properties.
 *     tags:
 *       - Tags
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
 *                   sites:
 *                     type: array
 *                     description: List of sites associated with this tag.
 *                     items:
 *                       type: string
 *                     example: ["site1", "site2"]
 *             example:
 *               - id: "507f1f77bcf86cd799439011"
 *                 type: "category"
 *                 name_fr: "Technologie"
 *                 name_en: "Technology"
 *                 url_fr: "technologie"
 *                 url_en: "technology"
 *                 sites: ["blog", "news"]
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

export async function GET(): Promise<NextResponse> {
	try {
		await db.connect();
		const tags = await TagModel.find({}, { _id: 0, __v: 0 });
		if (!tags) {return NextResponse.json({ status: 404, message: "No tags found" }, { status: 404 });}

		const formattedTags = tags.map((tag) => ({
			id: tag.id,
			type: tag.type,
			name_fr: tag.nameFr,
			name_en: tag.nameEn,
			url_fr: tag.urlFr,
			url_en: tag.urlEn,
		}));

		return NextResponse.json(formattedTags, { status: 200 });
	} catch (error) {
		console.error("Error retrieving tags:", error);
		return NextResponse.json({ status: 500, message: "Internal Server Error" }, { status: 500 });
	}
}
