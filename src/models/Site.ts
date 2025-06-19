import mongoose, { Document, ObjectId } from 'mongoose';
import type { InfrastructureName } from '@/types/infrastructure';
import { INFRASTRUCTURES } from '@/constants/infrastructures';

export interface ISite extends Document {
	_id: ObjectId;
	id: string;
	url: string;
	infrastructure: InfrastructureName;
	ticket?: string;
	comment?: string;
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
	ticket: { type: String, required: false },
	comment: { type: String, required: false },
	createdAt: { type: Date, required: true, default: Date.now },
});

export const SiteModel = mongoose.models.Site || mongoose.model<ISite>('Site', siteSchema);
