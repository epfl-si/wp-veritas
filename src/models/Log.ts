import mongoose, { Document, ObjectId } from 'mongoose';

export interface ILog extends Document {
	_id: ObjectId;
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
	level: 'info' | 'error' | 'warn' | 'debug' | 'system';
	timestamp: Date;
	userId?: string;
}

const logSchema = new mongoose.Schema<ILog>({
	id: { type: String, required: true, unique: true },
	message: { type: String, required: true },
	data: {
		type: { type: String, required: true },
		action: { type: String, required: true },
		id: { type: String, required: false },
		object: { type: mongoose.Schema.Types.Mixed, required: false },
		error: { type: String, required: false },
		count: { type: Number, required: false },
	},
	level: {
		type: String,
		enum: ['info', 'error', 'warn', 'debug', 'system'],
		required: true,
	},
	timestamp: { type: Date, default: Date.now },
	userId: { type: String, required: false },
});

export const LogModel = mongoose.models.Log || mongoose.model<ILog>('Log', logSchema);
