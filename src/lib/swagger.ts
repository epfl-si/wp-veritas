import swaggerJSDoc from "swagger-jsdoc";

export const getApiDocs = async () => {
	const options = {
		definition: {
			openapi: "3.0.0",
			info: {
				title: "WP-Veritas API",
				description: "API documentation for WP-Veritas",
				version: "1.0",
			},
			components: {
				securitySchemes: {
					BearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
			},
			security: [],
		},
		apis: ["./src/app/api/**/route.ts"],
	};

	const spec = swaggerJSDoc(options);
	return spec;
};
