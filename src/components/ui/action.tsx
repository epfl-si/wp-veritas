import Link from "next/link";
import type React from "react";
import { Button } from "@/components/ui/button";

interface ActionLinkProps {
	href: string;
	locked: boolean;
	className: string;
	children: React.ReactNode;
}

export function ActionLink({ href, locked, className, children }: ActionLinkProps) {
	if (locked) {
		return (
			<Button variant="outline" className={className} disabled>
				{children}
			</Button>
		);
	}
	return (
		<Button variant="outline" className={className} asChild>
			<Link prefetch={false} href={href}>
				{children}
			</Link>
		</Button>
	);
}
