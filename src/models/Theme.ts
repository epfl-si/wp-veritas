import mongoose, { Document, ObjectId } from 'mongoose';

export interface ITheme extends Document {
	_id: ObjectId;
	name: string;
}

const themeSchema = new mongoose.Schema<ITheme>({
	name: { type: String, required: true, unique: true },
});

export const ThemeModel = mongoose.models.Theme || mongoose.model<ITheme>('Theme', themeSchema);
