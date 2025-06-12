import { ArchiveIcon, BoxIcon, CloudIcon, ExternalLinkIcon, TimerIcon } from 'lucide-react';

export const TYPES = {
	KUBERNETES: {
		NAME: 'Kubernetes',
		LABEL: { fr: 'Kubernetes', en: 'Kubernetes' },
		ICON: CloudIcon,
		COLOR: '#3a85c7',
	},
	EXTERNAL: {
		NAME: 'External',
		LABEL: { fr: 'Externe', en: 'External' },
		ICON: ExternalLinkIcon,
		COLOR: '#5c8a8a',
	},
	LAMP: {
		NAME: 'LAMP',
		LABEL: { fr: 'LAMP', en: 'LAMP' },
		ICON: BoxIcon,
		COLOR: '#9d5fcf',
	},
	TEMPORARY: {
		NAME: 'Temporary',
		LABEL: { fr: 'Temporaire', en: 'Temporary' },
		ICON: TimerIcon,
		COLOR: '#e67043',
	},
	ARCHIVED: {
		NAME: 'Archived',
		LABEL: { fr: 'Archivé', en: 'Archived' },
		ICON: ArchiveIcon,
		COLOR: '#b5774a',
	},
};
