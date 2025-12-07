import mongoose, { Document } from "mongoose";

export interface ITheme extends Document {
	name: string;
}

const themeSchema = new mongoose.Schema<ITheme>({
	name: { type: String, required: true, unique: true },
});

export const ThemeModel = mongoose.models.Theme || mongoose.model<ITheme>("Theme", themeSchema);
