/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const swaggerJSDoc = require("swagger-jsdoc");

const spec = swaggerJSDoc({
	definition: {
		openapi: "3.0.0",
		info: { title: "WP-Veritas API", description: "API documentation for WP-Veritas", version: "1.0" },
		components: { securitySchemes: { BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
		security: [],
	},
	apis: ["./src/app/api/**/route.ts"],
});

fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/openapi.json", JSON.stringify(spec, null, 2));
