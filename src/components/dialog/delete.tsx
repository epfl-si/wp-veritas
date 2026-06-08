"use client";
import { AlertTriangle, Info, type LucideIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DeleteDialogProps {
	displayName: string;
	type: string;
	icon: LucideIcon;
	onDelete?: () => Promise<void>;
	onBulkDelete?: () => Promise<void>;
	itemCount?: number;
	triggerText?: string;
	isPlural?: boolean;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({ displayName, type, icon, onDelete, onBulkDelete, itemCount, triggerText, isPlural = false }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();
	const translations = {
		delete: useTranslations("actions.delete"),
		actions: useTranslations("actions"),
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		setError(null);

		try {
			if (onBulkDelete) {
				await onBulkDelete();
			} else if (onDelete) {
				await onDelete();
			}

			setIsOpen(false);
			setTimeout(() => {
				router.refresh();
			}, 500);
		} catch (error) {
			setError(error instanceof Error ? error.message : translations.delete("error", { object: type }));
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{triggerText ? (
					<Button variant="destructive" className="flex items-center space-x-1">
						<Trash2 className="w-4 h-4" />
						<span>{triggerText}</span>
					</Button>
				) : (
					<Button variant="outline" className="p-1 w-9 h-9 cursor-pointer border-2 border-red-400 text-red-600 hover:text-red-600 hover:bg-red-100">
						<Trash2 strokeWidth={2.3} className="size-5" />
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<AlertTriangle className="size-5" />
						{isPlural ? translations.delete("titlePlural", { object: type, count: itemCount ?? 0 }) : translations.delete("title", { object: type })}
					</DialogTitle>
					<DialogDescription className="text-gray-600">
						{isPlural ? translations.delete("descriptionPlural", { object: type, count: itemCount ?? 0 }) : translations.delete("description", { object: type })}
					</DialogDescription>
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
						<p className="">{translations.delete("irreversible")}</p>
					</div>
					<p className="text-xs text-red-600 mt-1">{isPlural ? translations.delete("warningPlural", { object: type, count: itemCount ?? 0 }) : translations.delete("warning", { object: type })}</p>
				</div>

				<DialogFooter className="flex gap-2 sm:gap-2">
					<Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting} className="flex-1">
						{translations.actions("cancel")}
					</Button>
					<Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1 gap-1 cursor-pointer">
						{isDeleting ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								{translations.delete("deleting")}
							</>
						) : (
							<>
								<Trash2 className="size-4" />
								{isPlural ? translations.delete("confirmPlural", { object: type, count: itemCount ?? 0 }) : translations.delete("confirm", { object: type })}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
