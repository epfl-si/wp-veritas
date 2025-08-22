"use client";

import { useEffect, useRef } from "react";
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from "swagger-ui-dist";
import "swagger-ui-dist/swagger-ui.css";

function ReactSwagger() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			SwaggerUIBundle({
				url: "/api/docs",
				dom_id: "#swagger-ui",
				presets: [
					SwaggerUIBundle.presets.apis,
					SwaggerUIStandalonePreset,
				],
			});
		}
	}, []);

	return <div id="swagger-ui" ref={ref}></div>;
}

export default ReactSwagger;
