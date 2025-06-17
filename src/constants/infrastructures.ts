import { ArchiveIcon, BoxIcon, CloudIcon, ExternalLinkIcon, TimerIcon } from 'lucide-react';

export const INFRASTRUCTURES = {
	KUBERNETES: {
		NAME: 'Kubernetes',
		LABEL: { fr: 'Kubernetes', en: 'Kubernetes' },
		ICON: CloudIcon,
		COLOR: '#3a85c7',
		CREATED: true,
		PERSISTENCE: 'kubernetes',
	},
	EXTERNAL: {
		NAME: 'External',
		LABEL: { fr: 'Externe', en: 'External' },
		ICON: ExternalLinkIcon,
		COLOR: '#5c8a8a',
		CREATED: true,
		PERSISTENCE: 'database',
	},
	LAMP: {
		NAME: 'LAMP',
		LABEL: { fr: 'LAMP', en: 'LAMP' },
		ICON: BoxIcon,
		COLOR: '#9d5fcf',
		CREATED: true,
		PERSISTENCE: 'database',
	},
	TEMPORARY: {
		NAME: 'Temporary',
		LABEL: { fr: 'Temporaire', en: 'Temporary' },
		ICON: TimerIcon,
		COLOR: '#e67043',
		CREATED: false,
		PERSISTENCE: 'none',
	},
	ARCHIVED: {
		NAME: 'Archived',
		LABEL: { fr: 'Archivé', en: 'Archived' },
		ICON: ArchiveIcon,
		COLOR: '#b5774a',
		CREATED: true,
		PERSISTENCE: 'database',
	},
};
