import mongoose, { type Document } from "mongoose";
import { INFRASTRUCTURES } from "@/constants/infrastructures";
import type { InfrastructureName } from "@/types/infrastructure";

export interface ISite extends Document {
	id: string;
	url: string;
	infrastructure: InfrastructureName;
	title?: string;
	tagline?: string;
	ticket?: string;
	comment?: string;
	monitored?: boolean;
	responsibles?: string[];
	createdAt: Date;
}

const siteSchema = new mongoose.Schema<ISite>({
	id: { type: String, required: true, unique: true },
	url: { type: String, required: true },
	infrastructure: {
		type: String,
		required: true,
		enum: Object.values(INFRASTRUCTURES).map((infra) => infra.NAME) as InfrastructureName[],
	},
	title: { type: String, required: false },
	tagline: { type: String, required: false },
	ticket: { type: String, required: false },
	comment: { type: String, required: false },
	monitored: { type: Boolean, required: false, default: false },
	responsibles: { type: [String], required: false, default: [] },
	createdAt: { type: Date, required: true, default: Date.now },
});

siteSchema.index({ url: 1 });
siteSchema.index({ infrastructure: 1 });
siteSchema.index({ createdAt: -1 });
siteSchema.index({ infrastructure: 1, createdAt: -1 });

export const SiteModel = mongoose.models.Site || mongoose.model<ISite>("Site", siteSchema);
