import { LogList } from "@/components/pages/log/list";
import { info } from "@/lib/log";

export default async function LogListPage() {
	await info("Logs search completed", {
		type: "log",
		action: "search",
	});

	return <LogList />;
}
