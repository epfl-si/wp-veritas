import mongoose, { Document, ObjectId } from 'mongoose';

export interface ITag extends Document {
	_id: ObjectId;
	id: string;
	type: string;
	nameFr: string;
	nameEn: string;
	urlFr: string;
	urlEn: string;
}

const tagSchema = new mongoose.Schema<ITag>({
	id: { type: String, required: true, unique: true },
	type: { type: String, required: true },
	nameFr: { type: String, required: true },
	nameEn: { type: String, required: true },
	urlFr: { type: String, required: true },
	urlEn: { type: String, required: true },
});

export const TagModel = mongoose.models.Tag || mongoose.model<ITag>('Tag', tagSchema);
