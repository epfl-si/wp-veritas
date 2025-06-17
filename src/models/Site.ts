import mongoose, { Document, ObjectId } from 'mongoose';

export interface iSite extends Document {
	_id: ObjectId;
	id: string;
	url: string;
	ticket: string;
	comment: string;
	infrastructure?: string;
	createdAt?: Date;
}

const siteSchema = new mongoose.Schema<iSite>({
	id: { type: String, required: true, unique: true },
	url: { type: String, required: true },
	ticket: { type: String, required: false },
	comment: { type: String, required: false },
	infrastructure: { type: String, required: false },
	createdAt: { type: Date, required: false },
});

export const SiteModel = mongoose.models.Site || mongoose.model<iSite>('Site', siteSchema);
