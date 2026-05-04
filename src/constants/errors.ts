import type { ErrorCode } from "@/types/error";

export const ERROR_TRANSLATIONS: Record<"fr" | "en", Record<ErrorCode, string>> = {
	fr: {
		UNAUTHORIZED: "Non autorisé",
		FORBIDDEN: "Accès refusé",
		NOT_FOUND: "Ressource introuvable",
		VALIDATION_ERROR: "Données invalides",
		DB_ERROR: "Erreur de base de données",
		MAIL_ERROR: "Erreur d'envoi de mail",
		UNKNOWN: "Erreur inconnue",
		SITE_ALREADY_EXISTS: "Ce site existe déjà",
		API_ERROR: "Erreur lors de la communication avec l'API",
	},
	en: {
		UNAUTHORIZED: "Unauthorized",
		FORBIDDEN: "Access denied",
		NOT_FOUND: "Resource not found",
		VALIDATION_ERROR: "Invalid data",
		DB_ERROR: "Database error",
		MAIL_ERROR: "Email sending error",
		UNKNOWN: "Unknown error",
		SITE_ALREADY_EXISTS: "This site already exists",
		API_ERROR: "Error communicating with the API",
	},
};
