import mongoose, { type Document } from "mongoose";
import type { LogData, LogLevel } from "@/types/log";

export interface ILog extends Document {
	id: string;
	message: string;
	data: LogData;
	level: LogLevel;
	timestamp: Date;
	userId?: string;
}

const logSchema = new mongoose.Schema<ILog>({
	id: { type: String, required: true, unique: true },
	message: { type: String, required: true },
	data: { type: mongoose.Schema.Types.Mixed, required: true },
	level: {
		type: String,
		enum: ["debug", "info", "warn", "error", "system"],
		required: true,
	},
	timestamp: { type: Date, default: Date.now },
	userId: { type: String, required: false },
});

logSchema.index({ timestamp: -1 });
logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ "data.action": 1, timestamp: -1 });
logSchema.index({ "data.id": 1, timestamp: -1 });

export const LogModel = mongoose.models.Log || mongoose.model<ILog>("Log", logSchema);
