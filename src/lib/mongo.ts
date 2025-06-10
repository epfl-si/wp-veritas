import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wp-veritas';

//@ts-expect-error global is not defined in TypeScript, but it is available in Node.js
let cached = global.mongoose;

if (!cached) {
	//@ts-expect-error global is not defined in TypeScript, but it is available in Node.js
	cached = global.mongoose = { conn: null, promise: null };
}

async function connect() {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
		};

		cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
			return mongoose;
		});
	}

	cached.conn = await cached.promise;

	return cached.conn;
}

async function disconnect() {
	await mongoose.disconnect();
}

const db = { connect, disconnect };
export default db;
