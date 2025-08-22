"use client";

import { useEffect, useRef } from "react";
import { SwaggerUIBundle } from "swagger-ui-dist";
import "swagger-ui-dist/swagger-ui.css";

type Props = {
	spec: Record<string, unknown>;
};

function ReactSwagger({ spec }: Props) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			SwaggerUIBundle({
				url: "",
				spec: spec,
				dom_id: "#swagger-ui",
				presets: [
					SwaggerUIBundle.presets.apis,
					SwaggerUIBundle.presets.standalone,
				],
			});
		}
	}, [spec]);

	return <div id="swagger-ui" ref={ref}></div>;
}

export default ReactSwagger;
