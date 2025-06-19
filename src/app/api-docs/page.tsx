import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function IndexPage() {
	const spec = (await getApiDocs()) as Record<string, unknown>;
	return <ReactSwagger spec={spec} />;
}
