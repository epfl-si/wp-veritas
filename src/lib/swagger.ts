import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
	const spec = createSwaggerSpec({
		apiFolder: "src/app/api",
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
	});
	return spec;
};
