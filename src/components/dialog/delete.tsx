"use client";
import React, { useState } from "react";
import { Trash2, AlertTriangle, LucideIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface DeleteDialogProps {
	displayName: string;
	apiEndpoint: string;
	type: string;
	icon: LucideIcon;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({ displayName, apiEndpoint, type, icon }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();
	const t = useTranslations("actions.delete");

	const handleDelete = async () => {
		setIsDeleting(true);
		setError(null);

		try {
			const response = await fetch(apiEndpoint, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(t("error", { object: type }));
			}

			setIsOpen(false);
			setTimeout(() => {
				router.refresh();
			}, 500);
		} catch (error) {
			setError(error instanceof Error ? error.message : t("error", { object: type }));
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" className="p-1 w-9 h-9 cursor-pointer border-2 border-red-400 text-red-600 hover:text-red-600 hover:bg-red-100">
					<Trash2 strokeWidth={2.3} className="size-5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<AlertTriangle className="size-5" />
						{t("title", { object: type })}
					</DialogTitle>
					<DialogDescription className="text-gray-600">{t("description", { object: type })}</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
						<p className="text-sm text-red-800 font-medium">{error}</p>
					</div>
				)}

				<div className="bg-gray-50 p-3 rounded-md border">
					<div className="flex items-center gap-2">
						{React.createElement(icon, { className: "size-5" })}
						<span className="font-medium text-gray-900 text-wrap">{displayName}</span>
					</div>
				</div>

				<div className="bg-red-50 border border-red-200 rounded-md p-3">
					<div className="flex gap-0.5 items-center text-sm text-red-800 font-medium">
						<Info className="size-4" />
						<p className="">{t("irreversible")}</p>
					</div>
					<p className="text-xs text-red-600 mt-1">{t("warning", { object: type })}</p>
				</div>

				<DialogFooter className="flex gap-2 sm:gap-2">
					<Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting} className="flex-1">
						{t("cancel")}
					</Button>
					<Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1 gap-1 cursor-pointer">
						{isDeleting ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								{t("deleting")}
							</>
						) : (
							<>
								<Trash2 className="size-4" />
								{t("confirm", { object: type })}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
