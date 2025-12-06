import mongoose, { Document } from "mongoose";

export interface ILog extends Document {
	id: string;
	message: string;
	data: {
		type: string;
		action: string;
		id?: string;
		object?: object;
		error?: string;
		count?: number;
		[key: string]: string | number | boolean | object | undefined;
	};
	level: "info" | "error" | "warn" | "debug" | "system";
	timestamp: Date;
	userId?: string;
}

const logSchema = new mongoose.Schema<ILog>({
	id: { type: String, required: true, unique: true },
	message: { type: String, required: true },
	data: {
		type: mongoose.Schema.Types.Mixed,
		required: true,
		validate: {
			validator: function (v: object) {
				return typeof v === "object" && v !== null && "type" in v && "action" in v && typeof v.type === "string" && typeof v.action === "string";
			},
			message: "Data must contain at least type and action fields",
		},
	},
	level: {
		type: String,
		enum: ["info", "error", "warn", "debug", "system"],
		required: true,
	},
	timestamp: { type: Date, default: Date.now },
	userId: { type: String, required: false },
});

export const LogModel = mongoose.models.Log || mongoose.model<ILog>("Log", logSchema);
