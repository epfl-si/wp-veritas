import { Bug, Info, AlertTriangle, XCircle, Settings } from 'lucide-react';

export const LOG_LEVELS = {
	DEBUG: {
		NAME: 'debug',
		LABEL: { fr: 'Débogage', en: 'Debug' },
		ICON: Bug,
		COLOR: '#10b981',
	},
	INFO: {
		NAME: 'info',
		LABEL: { fr: 'Information', en: 'Info' },
		ICON: Info,
		COLOR: '#10b981',
	},
	WARN: {
		NAME: 'warn',
		LABEL: { fr: 'Avertissement', en: 'Warning' },
		ICON: AlertTriangle,
		COLOR: '#f97316',
	},
	ERROR: {
		NAME: 'error',
		LABEL: { fr: 'Erreur', en: 'Error' },
		ICON: XCircle,
		COLOR: '#ef4444',
	},
	SYSTEM: {
		NAME: 'system',
		LABEL: { fr: 'Système', en: 'System' },
		ICON: Settings,
		COLOR: '#6b7280',
	},
};
