import mongoose, { Document, ObjectId } from "mongoose";
import type { TagCategoryEnumType } from "@/types/tag";
import { TAG_CATEGORIES_VALUES } from "@/constants/tags";

export interface ITag extends Document {
	_id: ObjectId;
	id: string;
	type: TagCategoryEnumType;
	nameFr: string;
	nameEn: string;
	urlFr: string;
	urlEn: string;
	sites: string[];
	createdAt: Date;
	updatedAt: Date;
}

const tagSchema = new mongoose.Schema<ITag>(
	{
		id: { type: String, required: true, unique: true },
		type: {
			type: String,
			required: true,
			enum: TAG_CATEGORIES_VALUES,
		},
		nameFr: { type: String, required: true },
		nameEn: { type: String, required: true },
		urlFr: { type: String, required: true },
		urlEn: { type: String, required: true },
		sites: { type: [String], default: [] },
	},
	{
		timestamps: true,
	},
);

export const TagModel = mongoose.models.Tag || mongoose.model<ITag>("Tag", tagSchema);
